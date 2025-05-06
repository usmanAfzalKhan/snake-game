// src/components/Header.js
import React from 'react';
import './Header.css';
import logo from '../images/logo.png';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Header = () => {
  const handleLogout = () => {
    signOut(auth).catch((err) => console.error('Logout error:', err));
  };

  return (
    <header className="header">
      <div className="header-content">
        <img
          src={logo}
          alt="Logo"
          className="logo"
          onClick={() => window.location.href = '/'}
        />
        {auth.currentUser && (
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
