// Footer.js
// This component renders the footer section shown at the bottom of the page.
// It includes a simple credit line with a link to the developer's GitHub profile.

import React from 'react';
import './Footer.css'; // Import styling specific to the footer

const Footer = () => {
  return (
    <footer className="site-footer">
      <p>
        {/* Developer credit with external link to GitHub */}
        Made by{' '}
        <a
          href="https://github.com/usmanAfzalKhan"
          target="_blank" // Open link in new tab
          rel="noopener noreferrer" // Security: prevents tab-nabbing
        >
          Usman Khan
        </a>
      </p>
    </footer>
  );
};

export default Footer;
