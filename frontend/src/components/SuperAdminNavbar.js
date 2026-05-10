import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SuperAdminNavbar.css';
import tradelisticLogo from '../Tradelistic Logo.png';

const SuperAdminNavbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('username');
    localStorage.removeItem('is_superadmin');
    navigate('/admin-login');
  };

  return (
    <nav className="super-admin-navbar">
      <div className="super-admin-nav-container">
        <div className="super-admin-nav-brand" onClick={() => navigate('/super-admin')}>
          <span className="super-admin-nav-logo">
            <img src={tradelisticLogo} alt="Tradelistic" />
          </span>
          <div>
            <h2>TRADELISTIC</h2>
            <p>Control workspace</p>
          </div>
        </div>

        <div className="super-admin-nav-actions">
          <button type="button" className="super-admin-nav-link" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
            Marketplace
          </button>
          <div className="super-admin-profile">
            <span className="super-admin-profile-icon">
              <i className="fas fa-user-shield" aria-hidden="true"></i>
            </span>
            <div>
              <strong>{username || 'admin'}</strong>
              <small>SUPERADMIN</small>
            </div>
          </div>
          <button className="super-admin-logout" onClick={handleLogout}>
            <i className="fas fa-right-from-bracket" aria-hidden="true"></i>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default SuperAdminNavbar;
