// Footer.js
// This component renders the footer section shown at the bottom of the page.
// It includes a simple credit line with a link to the developer's GitHub profile.

import React from "react";
import "./Footer.css"; // Import styling specific to the footer

const Footer = () => {
  return (
    <footer className="site-footer">
      <footer className="footer-credit">
        <p>
          🚀 Built with ❤️ by{" "}
          <a
            href="https://github.com/usmanAfzalKhan"
            target="_blank"
            rel="noopener noreferrer"
            className="credit-link"
          >
            Usman Khan
          </a>
        </p>
      </footer>
    </footer>
  );
};

export default Footer;
