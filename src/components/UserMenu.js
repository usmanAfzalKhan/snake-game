import React, { useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

// This component displays the user menu in the header, including navigation and logout options
const UserMenu = ({ userName }) => {
  const [open, setOpen] = useState(false); // Tracks whether the dropdown is open
  const auth = getAuth(); // Gets the Firebase auth instance
  const navigate = useNavigate(); // Used to programmatically navigate between routes

  // Logs out the user and redirects to homepage (login/welcome page)
  const handleLogout = () => {
    signOut(auth)
      .then(() => navigate('/')) // Redirect to "/" after logout
      .catch(console.error); // Log any errors
  };

  return (
    <div className="user-menu-container">
      {/* Clickable user menu toggle displaying the username */}
      <div className="user-toggle" onClick={() => setOpen(prev => !prev)}>
        {userName} ⏷ {/* Dropdown indicator */}
      </div>

      {/* Dropdown menu with navigation options - shown only when `open` is true */}
      {open && (
        <div className="user-dropdown">
          {/* Navigates back to main game screen */}
          <button onClick={() => navigate('/')}>🎮 Back to Game</button>

          {/* Navigates to the stats page */}
          <button onClick={() => navigate('/stats')}>📊 View Stats</button>

          {/* Triggers logout */}
          <button onClick={handleLogout}>🚪 Logout</button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
