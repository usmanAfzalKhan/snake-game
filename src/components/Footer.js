// src/components/Footer.js
import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <p>
        Made by {}
        <a
          href="https://github.com/usmanAfzalKhan"
          target="_blank"
          rel="noopener noreferrer"
        >
          Usman Khan
        </a>
      </p>
    </footer>
  );
};

export default Footer;
