import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import './Navbar.css';
import taxVisionLogo from '../../assets/taxvision-logo.png';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const leftLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/prediction', label: 'Prediksi' },
  ];

  const rightLinks = [
    { to: '/about', label: 'Tentang' },
  ];

  const mobileLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/prediction', label: 'Prediksi' },
    { to: '/about', label: 'Tentang' },
    ...(isLoggedIn
      ? [{ to: '/admin', label: 'Dashboard Admin' }]
      : [{ to: '/login', label: 'Masuk' }]
    ),
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setMobileOpen(false);
      navigate('/login');
    }
  };

  return (
    <div className="nav-root">
      <header className="nav">
        <nav className="nav-menu nav-menu-left">
          {leftLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`nav-link ${isActive(link.to) ? 'active' : ''}`}
            >
              <span className="nav-link-bg" />
              {isActive(link.to) && <span className="nav-link-underline" />}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav-brand">
          <Link to="/" className="nav-logo" aria-label="TaxVision">
            <img
              src={taxVisionLogo}
              alt="TaxVision Logo"
              className="nav-logo-img"
            />
            <span className="nav-logo-text">TaxVision</span>
          </Link>
        </div>

        <nav className="nav-menu nav-menu-right">
          {rightLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`nav-link ${isActive(link.to) ? 'active' : ''}`}
            >
              <span className="nav-link-bg" />
              {link.label}
            </Link>
          ))}

          {isLoggedIn && (
            <Link
              to="/admin"
              className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
            >
              <span className="nav-link-bg" />
              Dashboard Admin
            </Link>
          )}

          <div className="nav-actions">
            {!isLoggedIn ? (
              <Link
                to="/login"
                className="nav-icon-btn nav-icon-login"
                aria-label="Masuk"
              >
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="M12 3v11" />
                  <path d="M8 10l4 4 4-4" />
                  <path d="M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" />
                </svg>
              </Link>
            ) : (
              <button
                type="button"
                className="nav-icon-btn nav-icon-logout"
                aria-label="Logout"
                onClick={handleLogout}
              >
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M21 5v14a2 2 0 01-2 2h-6" />
                </svg>
              </button>
            )}

            <Link
              to="/about"
              className="nav-icon-btn nav-icon-help"
              aria-label="Bantuan"
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
                <path d="M9 10h.01" />
                <path d="M12 10h.01" />
                <path d="M15 10h.01" />
              </svg>
            </Link>
          </div>
        </nav>

        <button
          className={`nav-toggle ${mobileOpen ? 'active' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>
      </header>

      <div className={`nav-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {mobileLinks.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="nav-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}

        {isLoggedIn && (
          <button
            type="button"
            className="nav-mobile-link nav-mobile-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;