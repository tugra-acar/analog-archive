import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const closeMenu = () => setIsMenuOpen(false);
  
  const isAboutActive = location.pathname.startsWith('/about');
  
  // On person pages, show person name instead of "About"
  let aboutLabel = 'About';
  if (location.pathname === '/about/tugra') aboutLabel = 'Tuğra';
  if (location.pathname === '/about/damla') aboutLabel = 'Damla';

  const isMainPage = location.pathname === '/';

  return (
    <nav className="navbar">
      <NavLink to={isMainPage ? "/upload" : "/"} className="navbar-logo" aria-label={isMainPage ? "Upload" : "Home"} onClick={closeMenu}>
        <img src="assets/logo.svg" alt="D&T Film Archive" />
      </NavLink>
      
      <button className={`hamburger ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`navbar-links ${isMenuOpen ? 'mobile-open' : ''}`}>
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end
          onClick={closeMenu}
        >
          Main Page
        </NavLink>
        
        <NavLink 
          to="/archive" 
          className={({ isActive }) => `nav-link ${isActive || location.pathname.startsWith('/archive') ? 'active' : ''}`}
          onClick={closeMenu}
        >
          Archive
        </NavLink>
        
        <NavLink 
          to="/map" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={closeMenu}
        >
          Map
        </NavLink>
        
        <NavLink 
          to="/about" 
          className={`nav-link ${isAboutActive ? 'active' : ''}`}
          onClick={closeMenu}
        >
          {aboutLabel}
        </NavLink>
      </div>
    </nav>
  );
}
