import React from 'react';
import './Header.css';
import logo from '../images/logo.png';
import UserMenu from './UserMenu'; // ⬅️ Add this import

const Header = ({ userName, showMenu }) => {
  return (
    <header className="header">
      <div className="header-content">
        <img
          src={logo}
          alt="Logo"
          className="logo"
          onClick={() => window.location.href = '/'}
        />
        {showMenu && <UserMenu userName={userName} />} {/* ⬅️ Dropdown beside logo */}
      </div>
    </header>
  );
};

export default Header;
