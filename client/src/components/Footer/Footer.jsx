import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <span className="footer-copyright">
          &copy; {new Date().getFullYear()} SafeWebVerify.
          <a href="https://github.com/bsurajpatra/SafeWebVerify/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
             Licensed under MIT.
          </a>
        </span>
      </div>
    </footer>
  );
};

export default Footer; 