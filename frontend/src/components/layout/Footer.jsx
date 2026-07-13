import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-film-strip"></div>
      
      <div className="footer-content-wrapper">
        <div className="footer-top-section">
          {/* Left: Brand */}
          <div className="footer-brand">
            <h2 className="footer-logo">AURELUX</h2>
            <p className="footer-tagline">Cinema Without Limits</p>
          </div>

          {/* Center: Nav Links */}
          <nav className="footer-nav">
            <Link to="/" className="footer-link">Home</Link>
            <Link to="/movies" className="footer-link">Movies</Link>
            <Link to="/tv" className="footer-link">Shows</Link>
            <Link to="/anime" className="footer-link">Anime</Link>
          </nav>

          {/* Right: TMDB */}
          <div className="footer-tmdb-badge">
            <span className="footer-tmdb-text">Powered by TMDB</span>
          </div>
        </div>

        {/* Middle full width: Disclaimer */}
        <div className="footer-disclaimer">
          <p>
            This site does not store any files on our server, 
            we only linked to the media which is hosted on 
            3rd party services.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom-bar">
          <p>© 2025 Aurelux. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
