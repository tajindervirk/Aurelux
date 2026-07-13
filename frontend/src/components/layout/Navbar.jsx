import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuth, logoutUser } from '../../store/slices/authSlice';
import './Navbar.css';

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/movies', label: 'Movies' },
  { path: '/tv', label: 'Shows' },
  { path: '/anime', label: 'Anime' },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(selectAuth);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aurelux_theme') || 'dark';
  });

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Swipe logic state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Swipe handlers (Moved up to prevent TDZ error in useEffect)
  const onTouchStartHandle = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMoveHandle = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEndHandle = useCallback(() => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > 80) {
      setIsMobileMenuOpen(false); // Left swipe closes the menu
    }
  }, [touchStart, touchEnd]);

  // Effects
  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle passive touch events for mobile menu
  useEffect(() => {
    const el = mobileMenuRef.current;
    if (!el) return;

    const options = { passive: true };
    el.addEventListener('touchstart', onTouchStartHandle, options);
    el.addEventListener('touchmove', onTouchMoveHandle, options);
    el.addEventListener('touchend', onTouchEndHandle, options);

    return () => {
      el.removeEventListener('touchstart', onTouchStartHandle, options);
      el.removeEventListener('touchmove', onTouchMoveHandle, options);
      el.removeEventListener('touchend', onTouchEndHandle, options);
    };
  }, [isMobileMenuOpen, onTouchStartHandle, onTouchMoveHandle, onTouchEndHandle]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aurelux_theme', theme);
  }, [theme]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setIsDropdownOpen(false);
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  // Always show background if NOT on the Home page, or if scrolled, or if on mobile
  const isHomePage = location.pathname === '/';
  const shouldShowBackground = !isHomePage || isScrolled || isMobile;

  return (
    <>
      <nav className={`navbar ${shouldShowBackground ? 'navbar--scrolled' : ''}`}>
        {/* Logo */}
        <Link to="/" className="navbar__logo gold-text">
          AURELUX
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar__links">
          {NAV_LINKS.map(({ path, label }) => {
            const isActive =
              path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`navbar__link ${isActive ? 'navbar__link--active' : ''}`}
              >
                {label}
                {isActive && (
                  <motion.div
                    className="navbar__link-underline"
                    layoutId="nav-underline"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop Right Section */}
        <div className="navbar__right">
          {/* Search */}
          <div className="navbar__search-wrapper">
            <button
              className="navbar__icon-btn"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <AnimatePresence>
              {isSearchOpen && (
                <motion.form
                  className="navbar__search-form"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 250, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSearchSubmit}
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="navbar__search-input"
                    placeholder="Search movies, shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <button
            className="navbar__icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {/* Auth */}
          {isAuthenticated ? (
            <div className="navbar__user" ref={dropdownRef}>
              <button
                className="navbar__avatar"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-label="User menu"
              >
                {userInitial}
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    className="navbar__dropdown glass-card"
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="navbar__dropdown-header">
                      <span className="navbar__dropdown-name">{user?.name}</span>
                      <span className="navbar__dropdown-email">{user?.email}</span>
                    </div>
                    <div className="navbar__dropdown-divider" />
                    <Link to="/favorites" className="navbar__dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      ♥ Favorites
                    </Link>
                    <Link to="/watchlist" className="navbar__dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      ◎ Watchlist
                    </Link>
                    <Link to="/history" className="navbar__dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      ⏱ History
                    </Link>
                    <Link to="/reviews" className="navbar__dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      ✎ My Reviews
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="navbar__dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        ⚙ Admin Dashboard
                      </Link>
                    )}
                    <div className="navbar__dropdown-divider" />
                    <button className="navbar__dropdown-item navbar__dropdown-item--logout" onClick={handleLogout}>
                      ↦ Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="navbar__signin-btn">Sign In</Link>
          )}
        </div>

        {/* Mobile Actions (Visible only on mobile) */}
        <div className="navbar__mobile-actions">
          <Link to="/search" className="navbar__icon-btn navbar__mobile-search-btn" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          
          <button
            className="navbar__hamburger"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Menu"
          >
            <motion.span
              className="navbar__hamburger-line"
              animate={{ 
                rotate: isMobileMenuOpen ? 45 : 0, 
                y: isMobileMenuOpen ? 7 : 0 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
            <motion.span
              className="navbar__hamburger-line"
              animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="navbar__hamburger-line"
              animate={{ 
                rotate: isMobileMenuOpen ? -45 : 0, 
                y: isMobileMenuOpen ? -7 : 0 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Fullscreen Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            className="navbar__mobile-menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="navbar__mobile-grain"></div>
            
            <div className="navbar__mobile-header">
              <h1 className="navbar__mobile-brand">AURELUX</h1>
              <button
                className="navbar__mobile-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <div className="navbar__mobile-close-icon">
                  <span className="close-line line-1"></span>
                  <span className="close-line line-2"></span>
                </div>
              </button>
            </div>

            <div className="navbar__mobile-links">
              {NAV_LINKS.map(({ path, label }, i) => {
                const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                return (
                  <motion.div
                    key={path}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ delay: 0.08 * i, type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Link
                      to={path}
                      className={`navbar__mobile-link ${isActive ? 'navbar__mobile-link--active' : ''}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <div className="navbar__mobile-footer">
              {isAuthenticated ? (
                <div className="navbar__mobile-user-section">
                  <div className="navbar__mobile-user-top">
                    <div className="navbar__mobile-user-info">
                      <div className="navbar__avatar">{userInitial}</div>
                      <span className="navbar__mobile-user-name">{user?.name}</span>
                    </div>
                    <button className="navbar__mobile-logout" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                  <div className="navbar__mobile-sublinks">
                    <Link to="/favorites" className="navbar__mobile-sublink" onClick={() => setIsMobileMenuOpen(false)}>♥ Favorites</Link>
                    <Link to="/watchlist" className="navbar__mobile-sublink" onClick={() => setIsMobileMenuOpen(false)}>◎ Watchlist</Link>
                    <Link to="/history" className="navbar__mobile-sublink" onClick={() => setIsMobileMenuOpen(false)}>⏱ History</Link>
                    <Link to="/reviews" className="navbar__mobile-sublink" onClick={() => setIsMobileMenuOpen(false)}>✎ My Reviews</Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="navbar__mobile-sublink" onClick={() => setIsMobileMenuOpen(false)}>⚙ Admin Dashboard</Link>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="navbar__mobile-signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
