import React, { useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const UserMenu = ({ userName }) => {
  const [open, setOpen] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/')).catch(console.error);
  };

  return (
    <div className="user-menu-container">
      <div className="user-toggle" onClick={() => setOpen(prev => !prev)}>
        {userName} ⏷
      </div>
      {open && (
        <div className="user-dropdown">
          <button onClick={() => navigate('/stats')}>📊 View Stats</button>
          <button onClick={handleLogout}>🚪 Logout</button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
