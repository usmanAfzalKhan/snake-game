// src/components/Header.js
import React from 'react';
import logo from '../images/logo.png';
import './Header.css';

const Header = () => {
  return (
    <header className="site-header">
      <a href="/" className="logo-link">
        <img src={logo} alt="Byte N Slither Logo" className="site-logo" />
      </a>
      <h1 className="site-title">Byte N Slither</h1>
    </header>
  );
};

export default Header;
