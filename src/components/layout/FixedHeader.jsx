import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { assets } from '../../constants/assets';
import { navLinks } from '../../constants/navLinks';

export function FixedHeader({ onBookTable }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`site-header-fixed ${isMenuOpen ? 'menu-open' : ''}`}>
      <a className="site-logo" href="#" onClick={closeMenu}>
        <img src={assets.logo} alt="restaurant" />
      </a>
      
      <nav className={`site-nav ${isMenuOpen ? 'open' : ''}`} aria-label="Primary navigation">
        {navLinks.map((link) => (
          <a key={link} href={`#${link.toLowerCase()}`} onClick={closeMenu}>
            {link}
          </a>
        ))}
        <button 
          type="button" 
          className="nav-book-btn-mobile"
          onClick={() => {
            closeMenu();
            onBookTable();
          }}
        >
          Book a table
        </button>
      </nav>

      <div className="header-right">
        <button 
          type="button" 
          className="header-book-btn" 
          onClick={() => {
            closeMenu();
            onBookTable();
          }}
        >
          Book a table
        </button>
        
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}

export default FixedHeader;

