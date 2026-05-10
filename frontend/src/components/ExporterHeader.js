import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkStore, getNotifications, markNotificationRead } from '../services/api';
import '../styles/ExporterHeader.css';
import tradelisticLogo from '../Tradelistic Logo.png';

const ExporterHeader = ({ showBackButton = false, currentPage = 'Dashboard' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState({
    username: '',
    storeName: 'Loading...'
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const initializeHeader = async () => {
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

    initializeHeader();
  }, [navigate]);

  const loadNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 45000);
    window.addEventListener('notificationsUpdated', loadNotifications);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('notificationsUpdated', loadNotifications);
    };
  }, []);

  const openNotification = async (notification) => {
    try {
      await markNotificationRead(notification.id);
      await loadNotifications();
    } catch {
      // read state is non-blocking
    }

    if (notification.product_id) {
      navigate(`/product/${notification.product_id}`);
    }
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

  const handleNavigation = (path) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const openMainWebsite = () => {
    window.open('/', '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="exporter-header">
      <div className="exporter-header-shell">
        <div className="exporter-header-left">
          {showBackButton && (
            <button 
              onClick={() => navigate(-1)} 
              className="exporter-back-button"
              title="Go Back"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <div className="exporter-brand-logo" onClick={() => handleNavigation('/exporter-dashboard')}>
            <span className="exporter-brand-mark">
              <img src={tradelisticLogo} alt="Tradelistic" />
            </span>
            <span className="exporter-brand-text">
              <strong>TRADELISTIC</strong>
              <small>Seller workspace</small>
            </span>
          </div>
        </div>
        
        <div className="exporter-header-center">
          <div className="exporter-store-pill">
            <i className="fas fa-store"></i>
            <span>{userInfo.storeName}</span>
          </div>
          <div className="exporter-workspace-nav" aria-label="Exporter workspace navigation">
            <button
              type="button"
              className={location.pathname === '/exporter-dashboard' ? 'active' : ''}
              onClick={() => handleNavigation('/exporter-dashboard')}
              title="Go to exporter dashboard"
            >
              <i className="fas fa-table-columns"></i>
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              className={location.pathname === '/exporter-store' ? 'active' : ''}
              onClick={() => handleNavigation('/exporter-store')}
              title="Manage your store listings"
            >
              <i className="fas fa-store"></i>
              <span>My Store</span>
            </button>
            <button
              type="button"
              className="open-site"
              onClick={openMainWebsite}
              title="Open marketplace in a new tab"
            >
              <i className="fas fa-arrow-up-right-from-square"></i>
              <span>Main site</span>
            </button>
          </div>
        </div>
        
        <div className="exporter-header-right">
          <div className="exporter-notification-wrap">
            <button
              type="button"
              className="exporter-notification-btn"
              onClick={() => setShowNotifications((value) => !value)}
              title="Notifications"
            >
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="exporter-notification-menu">
                <div className="exporter-notification-head">
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        await markNotificationRead('all');
                        loadNotifications();
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="exporter-notification-list">
                  {notifications.length ? notifications.map((item) => (
                    <button key={item.id} type="button" className={item.is_read ? '' : 'unread'} onClick={() => openNotification(item)}>
                      <i className="fas fa-handshake"></i>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.message}</small>
                      </span>
                    </button>
                  )) : (
                    <div className="exporter-notification-empty">No notifications yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="exporter-user-profile">
            <div className="exporter-user-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="exporter-user-details">
              <span className="exporter-username">{userInfo.username}</span>
              <span className="exporter-user-type">Exporter</span>
            </div>
          </div>
          
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ExporterHeader;
