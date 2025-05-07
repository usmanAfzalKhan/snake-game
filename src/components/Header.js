// Header.js
// This component renders the top header bar with logo and user menu
// It also handles the logo click action which resets login state and navigates to home

import React, { useState } from 'react';
import './Header.css';
import logo from '../images/logo.png';
import UserMenu from './UserMenu';

const Header = ({ userName, showMenu, setLoginStarted }) => {
  const [logoClicked, setLogoClicked] = useState(false); // Tracks whether the logo has been clicked for animation

  // Handles click on logo: triggers animation, resets login, and updates URL
  const handleLogoClick = () => {
    setLogoClicked(true); // Adds animation class
    setLoginStarted(false); // Resets to welcome screen
    window.history.pushState({}, '', '/'); // Navigates to root without reloading page
    setTimeout(() => setLogoClicked(false), 600); // Removes animation class after animation duration
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo that resets app state when clicked */}
        <img
          src={logo}
          alt="Logo"
          className={`logo ${logoClicked ? 'clicked' : ''}`}
          onClick={handleLogoClick}
        />

        {/* User menu shown only when logged in */}
        {showMenu && <UserMenu userName={userName} />}
      </div>
    </header>
  );
};

export default Header;
