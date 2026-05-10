import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkStore } from '../services/api';
import '../styles/ExporterNavbar.css';
import tradelisticLogo from '../Tradelistic Logo.png';

const ExporterNavbar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    username: '',
    storeName: 'Loading...'
  });

  useEffect(() => {
    const initializeNavbar = async () => {
      try {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('user_type');
        const username = localStorage.getItem('username');
        
        if (!token || userType !== 'exporter') {
          navigate('/login');
          return;
        }

        // Fetch store information
        const storeResponse = await checkStore();
        if (storeResponse.data.has_store && storeResponse.data.store) {
          setUserInfo({
            username: username || 'Exporter',
            storeName: storeResponse.data.store.name || 'Your Store'
          });
        } else {
          setUserInfo({
            username: username || 'Exporter',
            storeName: 'Your Store'
          });
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
        const username = localStorage.getItem('username');
        setUserInfo({
          username: username || 'Exporter',
          storeName: 'Your Store'
        });
      }
    };

    initializeNavbar();
  }, [navigate]);

  const handleBackToDashboard = () => {
    navigate('/exporter-dashboard');
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_type');
      localStorage.removeItem('username');
      localStorage.removeItem('store_setup_complete');
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      {/* Back Button - Top Left Corner */}
      <button onClick={handleBackToDashboard} className="back-btn-corner">
        <i className="fas fa-arrow-left"></i>
      </button>

      <header className="exporter-navbar">
        <div className="navbar-content">
          <div className="navbar-center">
            <div className="brand-section">
              <div className="brand-logo">
                <span className="brand-logo-mark">
                  <img src={tradelisticLogo} alt="Tradelistic" />
                </span>
                <span>Tradelistic</span>
              </div>
              <div className="store-identity">
                <span className="store-name">{userInfo.storeName}</span>
                <span className="current-page">Add Product</span>
              </div>
            </div>
          </div>
          
          <div className="navbar-right">
            <div className="user-profile">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-details">
                <span className="username">{userInfo.username}</span>
                <span className="user-type">Store Owner</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default ExporterNavbar;
