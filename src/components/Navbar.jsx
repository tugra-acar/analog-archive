import { NavLink, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  
  const isAboutActive = location.pathname.startsWith('/about');
  
  // On person pages, show person name instead of "About"
  let aboutLabel = 'About';
  if (location.pathname === '/about/tugra') aboutLabel = 'Tuğra';
  if (location.pathname === '/about/damla') aboutLabel = 'Damla';

  const isMainPage = location.pathname === '/';

  return (
    <nav className="navbar">
      <NavLink to={isMainPage ? "/upload" : "/"} className="navbar-logo" aria-label={isMainPage ? "Upload" : "Home"}>
        <img src="/assets/logo.svg" alt="D&T Film Archive" />
      </NavLink>
      
      <div className="navbar-links">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end
        >
          Main Page
        </NavLink>
        
        <NavLink 
          to="/archive" 
          className={({ isActive }) => `nav-link ${isActive || location.pathname.startsWith('/archive') ? 'active' : ''}`}
        >
          Archive
        </NavLink>
        
        <NavLink 
          to="/map" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Map
        </NavLink>
        
        <NavLink 
          to="/about" 
          className={`nav-link ${isAboutActive ? 'active' : ''}`}
        >
          {aboutLabel}
        </NavLink>
      </div>
    </nav>
  );
}
