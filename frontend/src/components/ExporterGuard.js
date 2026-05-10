import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkStore } from '../services/api';

const ExporterGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(false);

  useEffect(() => {
    const checkExporterStore = async () => {
      const userType = localStorage.getItem('user_type');
      const token = localStorage.getItem('token');

      console.log('ExporterGuard Check:', { userType, hasToken: !!token, currentPath: location.pathname });

      // If not logged in, allow normal flow (login/signup pages)
      if (!token) {
        console.log('No token found, allowing normal flow');
        setLoading(false);
        return;
      }

      // If not an exporter, allow normal flow
      if (userType !== 'exporter') {
        console.log('Not an exporter, allowing normal flow');
        setLoading(false);
        return;
      }

      // If already on store-setup page, don't redirect
      if (location.pathname === '/store-setup') {
        console.log('Already on store-setup page');
        setLoading(false);
        return;
      }

      // For exporters, check if they have a store
      try {
        console.log('Checking store for exporter...');
        const response = await checkStore();
        console.log('Store check response:', response.data);
        
        if (response.data.has_store) {
          console.log('Exporter has store, allowing access');
          setHasStore(true);
          setLoading(false);
        } else {
          console.log('Exporter does not have store, redirecting to setup');
          // Exporter doesn't have a store, redirect to setup
          navigate('/store-setup', { replace: true });
        }
      } catch (error) {
        console.error('Error checking store:', error);
        // If API fails, assume no store exists
        if (error.response?.status === 401) {
          // Token is invalid, clear auth data and allow access to login
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_type');
          localStorage.removeItem('username');
          setLoading(false);
        } else {
          // Other API errors, redirect to store setup to be safe
          console.log('API call failed, redirecting to store setup');
          navigate('/store-setup', { replace: true });
        }
      }
    };

    checkExporterStore();
  }, [navigate, location.pathname]);

  // Handle browser back/forward events for exporters
  useEffect(() => {
    const userType = localStorage.getItem('user_type');
    const token = localStorage.getItem('token');

    if (token && userType === 'exporter' && location.pathname !== '/store-setup') {
      // If exporter tries to navigate away from store setup without completing it,
      // we need to re-check store status
      const handlePopState = () => {
        console.log('Browser navigation detected for exporter');
        // Force re-check by reloading the component
        window.location.reload();
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '1.2rem'
      }}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading...
      </div>
    );
  }

  return children;
};

export default ExporterGuard;