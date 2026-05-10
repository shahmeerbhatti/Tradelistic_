import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAdminDashboard, 
  getAdminUsers, 
  toggleUserStatus, 
  getPendingExporters, 
  approveExporter,
  getAdminTransactions,
  getTransactionAnalytics,
  toggleStoreStatus,
  toggleProductStatus
} from '../services/api';
import SuperAdminNavbar from '../components/SuperAdminNavbar';
import '../styles/SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [pendingExporters, setPendingExporters] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });
  const [productFilters, setProductFilters] = useState({
    search: '',
    category: '',
    status: ''
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(30);
  const [transactionFilters, setTransactionFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Loading states for operations
  const [loadingStoreToggle, setLoadingStoreToggle] = useState(null);
  const [approvalToast, setApprovalToast] = useState(null);
  const [approvingExporterId, setApprovingExporterId] = useState(null);
  
  // B2B Business Logic States
  const [businessMetrics, setBusinessMetrics] = useState({
    totalB2BOrders: 0,
    totalB2COrders: 0,
    averageOrderSize: 0,
    topExporters: [],
    monthlyGrowth: 0
  });
  
  // Filtered and paginated products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !productFilters.search || 
      product.name.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.description?.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.owner?.toLowerCase().includes(productFilters.search.toLowerCase());
    const matchesCategory = !productFilters.category || product.category === productFilters.category;
    const matchesStatus = !productFilters.status ||
      (productFilters.status === 'active' && product.is_active) ||
      (productFilters.status === 'inactive' && !product.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  
  // Filtered transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !transactionFilters.search || 
      transaction.customer_name?.toLowerCase().includes(transactionFilters.search.toLowerCase()) ||
      transaction.product_name?.toLowerCase().includes(transactionFilters.search.toLowerCase()) ||
      transaction.sales_id?.toString().includes(transactionFilters.search);
    const matchesStatus = !transactionFilters.status || transaction.order_status === transactionFilters.status;
    
    let matchesDate = true;
    if (transactionFilters.dateFrom) {
      matchesDate = matchesDate && new Date(transaction.created_at) >= new Date(transactionFilters.dateFrom);
    }
    if (transactionFilters.dateTo) {
      matchesDate = matchesDate && new Date(transaction.created_at) <= new Date(transactionFilters.dateTo);
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  useEffect(() => {
    document.title = 'Super Admin Dashboard - Tradelistic';
    
    const token = localStorage.getItem('token');
    const isSuperAdmin = localStorage.getItem('is_superadmin') === 'true';
    
    console.log('=== Super Admin Dashboard Initialization ===');
    console.log('Token exists:', !!token);
    console.log('Is Super Admin:', isSuperAdmin);
    console.log('Initial state arrays:');
    console.log('- users:', Array.isArray(users), users.length);
    console.log('- pendingExporters:', Array.isArray(pendingExporters), pendingExporters.length);
    console.log('- stores:', Array.isArray(stores), stores.length);
    console.log('- products:', Array.isArray(products), products.length);
    console.log('- transactions:', Array.isArray(transactions), transactions.length);
    
    if (!token || !isSuperAdmin) {
      console.log('Authentication failed, redirecting...');
      navigate('/admin-login');
      return;
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      console.log('=== Loading Dashboard Data ===');
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        navigate('/admin-login');
        return;
      }
      
      console.log('Making direct fetch call to admin dashboard...');
      
      // Use direct fetch approach like the successful manual test
      const response = await fetch('http://127.0.0.1:8000/api/users/admin/dashboard/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Dashboard API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Dashboard API failed: ${response.status} ${response.statusText}`);
      }
      
      const dashboardData = await response.json();
      console.log('Dashboard data received:', dashboardData);
      
      // Set the stats directly from the API response
      setStats(dashboardData);
      console.log('✅ Dashboard stats updated successfully!');
      
      setLoading(false);
      
    } catch (error) {
      console.error('=== Dashboard Loading Failed ===');
      console.error('Error:', error.message);
      
      setLoading(false);
      
      if (error.message.includes('401')) {
        console.error('Authentication failed');
        navigate('/admin-login');
      } else if (error.message.includes('403')) {
        console.error('Access denied');
        alert('Access denied. Super admin privileges required.');
        navigate('/admin-login');
      } else {
        console.error('General error loading dashboard');
        // Set fallback values so user can see something
        setStats({
          total_users: 'Error',
          total_importers: 'Error',
          total_exporters: 'Error',
          total_stores: 'Error',
          total_products: 'Error',
          total_sales: 'Error',
          total_revenue: 'Error'
        });
      }
    }
  };

  const loadUsers = async () => {
    try {
      console.log('Loading users with filters:', filters);
      const response = await getAdminUsers(filters);
      const usersData = response.data || response || [];
      console.log('Users loaded:', usersData);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadPendingExporters = async () => {
    try {
      console.log('Loading pending exporters...');
      const response = await getPendingExporters();
      const exportersData = response.data || response || [];
      console.log('Pending exporters loaded:', exportersData);
      setPendingExporters(Array.isArray(exportersData) ? exportersData : []);
    } catch (error) {
      console.error('Error loading pending exporters:', error);
      setPendingExporters([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'exporters') {
      loadPendingExporters();
    } else if (activeTab === 'stores') {
      loadStores();
    } else if (activeTab === 'products') {
      loadProducts();
    } else if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab, filters, productFilters]);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this user?`)) {
      try {
        await toggleUserStatus(userId);
        loadUsers();
        loadDashboardData();
        alert('User status updated successfully');
      } catch (error) {
        console.error('Error toggling user status:', error);
        alert('Error updating user status');
      }
    }
  };

  const handleApproveExporter = async (userId) => {
    if (window.confirm('Approve this exporter account?')) {
      try {
        setApprovingExporterId(userId);
        const exporter = pendingExporters.find((item) => item.id === userId);
        await approveExporter(userId);
        setApprovalToast({
          name: exporter?.store_name || exporter?.username || 'Exporter',
          message: 'Approved successfully'
        });
        await loadPendingExporters();
        await loadDashboardData();
        setTimeout(() => setApprovalToast(null), 3200);
      } catch (error) {
        console.error('Error approving exporter:', error);
        alert('Error approving exporter');
      } finally {
        setApprovingExporterId(null);
      }
    }
  };

  const loadStores = async () => {
    try {
      console.log('Loading stores...');
      
      // Try new admin stores endpoint first
      let storesData = [];
      
      try {
        const response = await fetch('http://127.0.0.1:8000/api/stores/admin/list/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          storesData = await response.json();
          console.log('✅ Stores loaded from admin endpoint:', storesData.length);
        }
      } catch (adminError) {
        console.log('Admin stores API failed, trying regular stores endpoint...');
        
        try {
          const response = await fetch('http://127.0.0.1:8000/api/stores/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            storesData = await response.json();
          }
        } catch (storeError) {
          console.log('Direct stores API failed, trying users with stores...');
          
          // Fallback: get users who have stores
          try {
            const userResponse = await fetch('http://127.0.0.1:8000/api/users/admin/users/?role=exporter', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (userResponse.ok) {
              const usersData = await userResponse.json();
              storesData = (usersData || []).filter(user => user.store_name).map(user => ({
                id: user.id,
                name: user.store_name,
                owner: user.username,
                owner_name: `${user.first_name} ${user.last_name}`.trim() || user.username,
                email: user.email,
                phone: user.phone || 'N/A',
                business_type: user.business_type || 'Business',
                established_year: user.established_year || null,
                website: user.website || null,
                is_active: user.is_active,
                created_at: user.date_joined
              }));
            }
          } catch (fallbackError) {
            console.error('All store loading methods failed:', fallbackError);
          }
        }
      }
      
      console.log('Stores loaded:', storesData);
      setStores(Array.isArray(storesData) ? storesData : []);
      
    } catch (error) {
      console.error('Error loading stores:', error);
      setStores([]);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('Loading products...');
      const response = await fetch('http://127.0.0.1:8000/api/products/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const productsData = await response.json();
        console.log('Products loaded:', productsData?.length || 0);
        
        // Enhance product data with additional fields
        const enhancedProducts = (productsData || []).map(product => ({
          ...product,
          owner: product.owner || product.user || 'Unknown',
          view_count: product.view_count || 0,
          stock_quantity: product.stock_quantity || 0,
          b2b_orders: product.b2b_orders || 0,
          category: product.category || 'others',
          is_active: product.is_active !== false
        }));
        
        setProducts(enhancedProducts);
      } else {
        console.warn('Failed to load products:', response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };

  const loadTransactions = async () => {
    try {
      console.log('Loading transactions with new admin API...');
      
      // Try new admin endpoint first
      try {
        const response = await getAdminTransactions();
        const transactionsData = response.data;
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
        calculateBusinessMetrics(transactionsData);
        console.log('✅ Transactions loaded via admin API:', transactionsData.length);
        return;
      } catch (adminError) {
        console.log('Admin API failed, trying direct fetch...');
      }
      
      // Fallback to direct fetch
      const response = await fetch('http://127.0.0.1:8000/api/transactions/admin/sales/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Try alternative endpoint if first fails
        console.log('Trying alternative transactions endpoint...');
        const altResponse = await fetch('http://127.0.0.1:8000/api/transactions/sales/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (altResponse.ok) {
          const transactionsData = await altResponse.json();
          const processedData = Array.isArray(transactionsData) ? transactionsData : [];
          setTransactions(processedData);
          calculateBusinessMetrics(processedData);
          console.log('✅ Transactions loaded from alternative endpoint:', processedData.length);
        } else {
          console.warn('All transaction endpoints failed');
          setTransactions([]);
          setBusinessMetrics({
            totalB2BOrders: 0,
            totalB2COrders: 0,
            averageOrderSize: 0,
            topExporters: [],
            monthlyGrowth: 0
          });
        }
      } else {
        const transactionsData = await response.json();
        const processedData = Array.isArray(transactionsData) ? transactionsData : [];
        setTransactions(processedData);
        calculateBusinessMetrics(processedData);
        console.log('✅ Transactions loaded:', processedData.length);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
      setBusinessMetrics({
        totalB2BOrders: 0,
        totalB2COrders: 0,
        averageOrderSize: 0,
        topExporters: [],
        monthlyGrowth: 0
      });
    }
  };
  
  const calculateBusinessMetrics = (transactionsData) => {
    if (!Array.isArray(transactionsData) || transactionsData.length === 0) {
      setBusinessMetrics({
        totalB2BOrders: 0,
        totalB2COrders: 0,
        averageOrderSize: 0,
        topExporters: [],
        monthlyGrowth: 0
      });
      return;
    }
    
    const b2bOrders = transactionsData.filter(t => parseFloat(t.final_total) >= 1000); // B2B threshold
    const b2cOrders = transactionsData.filter(t => parseFloat(t.final_total) < 1000);
    const totalRevenue = transactionsData.reduce((sum, t) => sum + parseFloat(t.final_total || 0), 0);
    const avgOrderSize = transactionsData.length > 0 ? totalRevenue / transactionsData.length : 0;
    
    // Calculate top exporters
    const exporterSales = {};
    transactionsData.forEach(t => {
      const exporter = t.exporter_name || 'Unknown';
      if (!exporterSales[exporter]) {
        exporterSales[exporter] = { name: exporter, sales: 0, revenue: 0 };
      }
      exporterSales[exporter].sales++;
      exporterSales[exporter].revenue += parseFloat(t.final_total || 0);
    });
    
    const topExporters = Object.values(exporterSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    setBusinessMetrics({
      totalB2BOrders: b2bOrders.length,
      totalB2COrders: b2cOrders.length,
      averageOrderSize: avgOrderSize,
      topExporters: topExporters,
      monthlyGrowth: 0 // Would need historical data for this
    });
  };

  const handleToggleStoreStatus = async (storeId, currentStatus) => {
    const action = currentStatus ? 'suspend' : 'activate';
    const actionTitle = currentStatus ? 'Suspend Store' : 'Activate Store';
    
    if (window.confirm(`Are you sure you want to ${action} this store?\n\nThis will ${action} the store owner's account and affect their ability to manage products and receive orders.`)) {
      setLoadingStoreToggle(storeId);
      
      try {
        console.log(`Toggling store ${storeId} status from ${currentStatus} to ${!currentStatus}`);
        
        const response = await toggleStoreStatus(storeId);
        
        if (response.data.success) {
          // Reload stores data to reflect the change
          await loadStores();
          // Also reload dashboard stats to update counts
          await loadDashboardData();
          
          const actionMessage = response.data.new_status ? 'activated' : 'suspended';
          
          // Show success message with better formatting
          alert(`✅ Success!\n\nStore has been ${actionMessage} successfully.\n\nThe store owner's account is now ${response.data.new_status ? 'active' : 'suspended'}.`);
        } else {
          throw new Error(response.data.error || 'Failed to update store status');
        }
      } catch (error) {
        console.error('Error toggling store status:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Error updating store status';
        alert(`❌ Error\n\n${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
      } finally {
        setLoadingStoreToggle(null);
      }
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/products/${productId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          loadProducts();
          loadDashboardData();
          alert('Product deleted successfully');
          // Reset to first page if current page becomes empty
          if (currentProducts.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        } else {
          alert('Error deleting product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  };

  const handleToggleProductStatus = async (product) => {
    const action = product.is_active ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this product?`)) {
      try {
        await toggleProductStatus(product.id);
        await loadProducts();
        await loadDashboardData();
        alert(`Product ${product.is_active ? 'deactivated' : 'activated'} successfully`);
      } catch (error) {
        console.error('Error updating product status:', error);
        alert(error.response?.data?.error || 'Error updating product status');
      }
    }
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="pagination-container d-flex justify-content-between align-items-center mt-3">
        <div className="pagination-info">
          Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
        </div>
        <nav>
          <ul className="pagination mb-0">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </button>
            </li>
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>
            {pages.map(page => (
              <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };



  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading Super Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="super-admin-dashboard">
      <SuperAdminNavbar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <span className="dashboard-kicker">Separate admin interface</span>
          <h1>Super Admin Dashboard</h1>
          <p className="text-muted">Platform management, approvals, listing controls and transaction visibility.</p>
        </div>

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-chart-line me-2"></i>Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users me-2"></i>User Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'exporters' ? 'active' : ''}`}
            onClick={() => setActiveTab('exporters')}
          >
            <i className="fas fa-user-check me-2"></i>Pending Exporters
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => setActiveTab('stores')}
          >
            <i className="fas fa-store me-2"></i>Store Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <i className="fas fa-box me-2"></i>Product Monitor
          </button>
          <button 
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <i className="fas fa-receipt me-2"></i>Transactions
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon users">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-details">
                    <h3>{stats.total_users || 0}</h3>
                    <p>Total Users</p>
                    <small className="text-muted">
                      {stats.total_importers || 0} Importers, {stats.total_exporters || 0} Exporters
                    </small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon stores">
                    <i className="fas fa-store"></i>
                  </div>
                  <div className="stat-details">
                    <h3>{stats.total_stores || 0}</h3>
                    <p>Total Stores</p>
                    <small className="text-muted">
                      {stats.active_stores || 0} Active
                    </small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon products">
                    <i className="fas fa-box"></i>
                  </div>
                  <div className="stat-details">
                    <h3>{stats.total_products || 0}</h3>
                    <p>Total Products</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon sales">
                    <i className="fas fa-shopping-cart"></i>
                  </div>
                  <div className="stat-details">
                    <h3>{stats.total_sales || 0}</h3>
                    <p>Total Sales</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon revenue">
                    <i className="fas fa-dollar-sign"></i>
                  </div>
                  <div className="stat-details">
                    <h3>${parseFloat(stats.total_revenue || 0).toFixed(2)}</h3>
                    <p>Total Revenue</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon pending">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="stat-details">
                    <h3>{stats.pending_exporters || 0}</h3>
                    <p>Pending Exporters</p>
                  </div>
                </div>
              </div>

              <div className="recent-activity mt-4">
                <h3>Platform Insights</h3>
                <div className="insight-cards">
                  <div className="insight-card">
                    <i className="fas fa-chart-line text-success"></i>
                    <div>
                      <h5>Platform Growth</h5>
                      <p>Monitor user acquisition and engagement trends</p>
                    </div>
                  </div>
                  <div className="insight-card">
                    <i className="fas fa-shield-alt text-primary"></i>
                    <div>
                      <h5>Security & Moderation</h5>
                      <p>Manage user reports and suspicious activities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="users-tab">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h3>User Management</h3>
                  <p className="text-muted mb-0">
                    {Array.isArray(users) ? `${users.length} users loaded` : 'Loading users...'}
                  </p>
                </div>
                <button className="btn btn-outline-primary" onClick={loadUsers}>
                  <i className="fas fa-sync me-2"></i>Refresh
                </button>
              </div>

              <div className="filters-bar mb-3">
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="form-control search-input"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
                <select 
                  className="form-select filter-select"
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="importer">Importers</option>
                  <option value="exporter">Exporters</option>
                </select>
                <select 
                  className="form-select filter-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {!Array.isArray(users) ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading users...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No users found</p>
                  <small className="text-muted">Users will appear here once they register</small>
                </div>
              ) : (
                <div className="users-table-container">
                <table className="table users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Store</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(users) && users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-info">
                            <strong>{user.username}</strong>
                            {user.first_name && <small>{user.first_name} {user.last_name}</small>}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge badge-${user.user_type}`}>
                            {user.user_type}
                          </span>
                          {user.is_superadmin && (
                            <span className="badge badge-admin ms-1">Admin</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                            {user.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                        <td>
                          {user.user_type === 'exporter' && user.store_name ? (
                            <span className="text-success">
                              <i className="fas fa-check-circle me-1"></i>
                              {user.store_name}
                            </span>
                          ) : user.user_type === 'exporter' ? (
                            <span className="text-muted">No store</span>
                          ) : '-'}
                        </td>
                        <td>
                          {!user.is_superadmin && (
                            <button 
                              className={`btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                              onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                            >
                              {user.is_active ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}

          {/* Pending Exporters Tab */}
          {activeTab === 'exporters' && (
            <div className="exporters-tab">
              <h3>Exporter Approval Requests</h3>
              <p className="text-muted">Review and approve exporter accounts</p>

              {approvalToast && (
                <div className="approval-success-toast" role="status">
                  <span>
                    <i className="fas fa-check" aria-hidden="true"></i>
                  </span>
                  <div>
                    <strong>{approvalToast.name}</strong>
                    <p>{approvalToast.message}</p>
                  </div>
                </div>
              )}

              <div className="exporters-grid">
                {!Array.isArray(pendingExporters) || pendingExporters.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-check-circle"></i>
                    <p>No pending exporters at the moment</p>
                    {!Array.isArray(pendingExporters) && (
                      <small className="text-muted">Loading exporters...</small>
                    )}
                  </div>
                ) : (
                  pendingExporters.map(exporter => (
                    <div key={exporter.id} className="exporter-card">
                      <div className="exporter-header">
                        <h5>{exporter.username}</h5>
                        <span className="badge bg-warning">Pending</span>
                      </div>
                      <div className="exporter-details">
                        <p><strong>Email:</strong> {exporter.email}</p>
                        <p><strong>Name:</strong> {exporter.first_name} {exporter.last_name}</p>
                        <p><strong>Joined:</strong> {new Date(exporter.date_joined).toLocaleDateString()}</p>
                        
                        {exporter.store_name ? (
                          <>
                            <hr />
                            <h6>Store Information</h6>
                            <p><strong>Store Name:</strong> {exporter.store_name}</p>
                            <p><strong>Business Type:</strong> {exporter.business_type}</p>
                            {exporter.established_year && (
                              <p><strong>Established:</strong> {exporter.established_year}</p>
                            )}
                            {exporter.employee_count && (
                              <p><strong>Employees:</strong> {exporter.employee_count}</p>
                            )}
                            {exporter.website && (
                              <p><strong>Website:</strong> <a href={exporter.website} target="_blank" rel="noopener noreferrer">{exporter.website}</a></p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted"><i>No store created yet</i></p>
                        )}
                      </div>
                      <div className="exporter-actions">
                        <button 
                          className="btn btn-success"
                          onClick={() => handleApproveExporter(exporter.id)}
                          disabled={approvingExporterId === exporter.id}
                        >
                          <i className={`fas ${approvingExporterId === exporter.id ? 'fa-spinner fa-spin' : 'fa-check'} me-2`}></i>
                          {approvingExporterId === exporter.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button 
                          className="btn btn-outline-danger"
                          onClick={() => handleToggleUserStatus(exporter.id, true)}
                        >
                          <i className="fas fa-times me-2"></i>Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Store Management Tab */}
          {activeTab === 'stores' && (
            <div className="stores-tab">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Store Management</h3>
                <button className="btn btn-outline-primary" onClick={loadStores}>
                  <i className="fas fa-sync me-2"></i>Refresh
                </button>
              </div>
              
              <div className="stores-grid">
                {!Array.isArray(stores) || stores.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-store fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No stores found</p>
                    {!Array.isArray(stores) ? (
                      <small className="text-muted">Loading stores...</small>
                    ) : (
                      <small className="text-muted">Stores will appear here when exporters create their stores</small>
                    )}
                  </div>
                ) : (
                  stores.map(store => (
                    <div key={store.id} className="store-card">
                      <div className="store-header">
                        <div className="store-logo">
                          {store.logo ? (
                            <img src={store.logo} alt={store.name} />
                          ) : (
                            <i className="fas fa-store"></i>
                          )}
                        </div>
                        <div className="store-info">
                          <h5>{store.name}</h5>
                          <div className="d-flex gap-2 align-items-center">
                            <span className={`badge ${store.is_active ? 'bg-success' : 'bg-danger'}`}>
                              <i className={`fas ${store.is_active ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                              {store.is_active ? 'Active' : 'Suspended'}
                            </span>
                            {store.products_count > 0 && (
                              <span className="badge bg-info">
                                <i className="fas fa-box me-1"></i>
                                {store.products_count} Products
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="store-details">
                        <div className="row">
                          <div className="col-md-6">
                            <p><strong>Owner:</strong> {store.owner_name || store.owner}</p>
                            <p><strong>Username:</strong> {store.owner}</p>
                            <p><strong>Business:</strong> {store.business_type || 'General Business'}</p>
                          </div>
                          <div className="col-md-6">
                            <p><strong>Phone:</strong> {store.phone || 'Not provided'}</p>
                            <p><strong>Email:</strong> {store.email || 'Not provided'}</p>
                            {store.website && (
                              <p><strong>Website:</strong> 
                                <a href={store.website} target="_blank" rel="noopener noreferrer" className="ms-1">
                                  <i className="fas fa-external-link-alt"></i> Visit
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                        {store.address && (
                          <div className="mt-2">
                            <p><strong>Address:</strong> {store.address}</p>
                          </div>
                        )}
                        {store.established_year && (
                          <p><strong>Established:</strong> {store.established_year}</p>
                        )}
                        {store.created_at && (
                          <p><strong>Joined:</strong> {new Date(store.created_at).toLocaleDateString()}</p>
                        )}
                      </div>
                      
                      <div className="store-actions">
                        <div className="d-flex gap-2 justify-content-between">
                          <button 
                            className={`btn btn-sm ${store.is_active ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleStoreStatus(store.id, store.is_active)}
                            disabled={loadingStoreToggle === store.id}
                            title={`${store.is_active ? 'Suspend' : 'Activate'} this store and owner account`}
                          >
                            {loadingStoreToggle === store.id ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                {store.is_active ? 'Suspending...' : 'Activating...'}
                              </>
                            ) : (
                              <>
                                <i className={`fas ${store.is_active ? 'fa-pause' : 'fa-play'} me-1`}></i>
                                {store.is_active ? 'Suspend Store' : 'Activate Store'}
                              </>
                            )}
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            title="View store details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </div>
                        {!store.is_active && (
                          <small className="text-muted mt-2 d-block">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            Store owner account is suspended
                          </small>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Product Monitor Tab */}
          {activeTab === 'products' && (
            <div className="products-tab">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h3>Product Monitor</h3>
                  <p className="text-muted mb-0">Manage {filteredProducts.length} products ({products.length} total)</p>
                </div>
                <button className="btn btn-outline-primary" onClick={loadProducts}>
                  <i className="fas fa-sync me-2"></i>Refresh
                </button>
              </div>
              
              <div className="filters-bar mb-3">
                <input 
                  type="text" 
                  placeholder="Search by name, owner, or description..." 
                  className="form-control search-input"
                  value={productFilters.search}
                  onChange={(e) => {
                    setProductFilters(prev => ({ ...prev, search: e.target.value }));
                    setCurrentPage(1); // Reset to first page on search
                  }}
                />
                <select 
                  className="form-select filter-select"
                  value={productFilters.category}
                  onChange={(e) => {
                    setProductFilters(prev => ({ ...prev, category: e.target.value }));
                    setCurrentPage(1); // Reset to first page on filter
                  }}
                >
                  <option value="">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                  <option value="home">Home & Garden</option>
                  <option value="books">Books</option>
                  <option value="sports">Sports</option>
                  <option value="automotive">Automotive</option>
                  <option value="health">Health & Beauty</option>
                  <option value="industrial">Industrial</option>
                  <option value="others">Others</option>
                </select>
                <select
                  className="form-select filter-select"
                  value={productFilters.status}
                  onChange={(e) => {
                    setProductFilters(prev => ({ ...prev, status: e.target.value }));
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              {filteredProducts.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No products found matching your criteria</p>
                </div>
              ) : (
                <>
                  <div className="products-table-container">
                    <table className="table products-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Owner</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Stock</th>
                          <th>Views</th>
                          <th>B2B Orders</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProducts.map(product => (
                          <tr key={product.id}>
                            <td>
                              <div className="product-info">
                                <strong>{product.name}</strong>
                                <small className="d-block text-muted">
                                  {product.description?.substring(0, 50)}{product.description?.length > 50 ? '...' : ''}
                                </small>
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-info">{product.owner}</span>
                            </td>
                            <td>
                              <span className="badge bg-secondary">{product.category}</span>
                            </td>
                            <td>
                              <strong>${parseFloat(product.price).toFixed(2)}</strong>
                              {parseFloat(product.price) >= 1000 && (
                                <small className="d-block text-success">B2B Price</small>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${product.is_active ? 'bg-success' : 'bg-danger'}`}>
                                {product.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                (product.stock_quantity || 0) > 10 ? 'bg-success' :
                                (product.stock_quantity || 0) > 0 ? 'bg-warning' : 'bg-danger'
                              }`}>
                                {product.stock_quantity || 0}
                              </span>
                            </td>
                            <td>{product.view_count || 0}</td>
                            <td>
                              <span className="badge bg-primary">
                                {product.b2b_orders || 0}
                              </span>
                            </td>
                            <td>{new Date(product.created_at).toLocaleDateString()}</td>
                            <td>
                              <div className="btn-group" role="group">
                                <button 
                                  className="btn btn-sm btn-outline-primary product-action-btn"
                                  title="View Details"
                                  onClick={() => navigate(`/product/${product.id}`)}
                                >
                                  <i className="fas fa-eye"></i>
                                  View
                                </button>
                                <button
                                  className={`btn btn-sm product-action-btn ${product.is_active ? 'btn-warning' : 'btn-success'}`}
                                  onClick={() => handleToggleProductStatus(product)}
                                  title={product.is_active ? 'Deactivate Product' : 'Activate Product'}
                                >
                                  <i className={`fas ${product.is_active ? 'fa-pause' : 'fa-play'}`}></i>
                                  {product.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger product-action-btn"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  title="Delete Product"
                                >
                                  <i className="fas fa-trash"></i>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination()}
                </>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="transactions-tab">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h3>Transaction Monitor</h3>
                  <p className="text-muted mb-0">{filteredTransactions.length} transactions ({transactions.length} total)</p>
                </div>
                <button className="btn btn-outline-primary" onClick={loadTransactions}>
                  <i className="fas fa-sync me-2"></i>Refresh
                </button>
              </div>
              
              <div className="transaction-stats mb-4">
                <div className="row">
                  <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div className="stat-card">
                      <div className="stat-icon revenue">
                        <i className="fas fa-dollar-sign"></i>
                      </div>
                      <div className="stat-details">
                        <h4>${parseFloat(stats.total_revenue || 0).toLocaleString()}</h4>
                        <p>Total Revenue</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div className="stat-card">
                      <div className="stat-icon sales">
                        <i className="fas fa-shopping-cart"></i>
                      </div>
                      <div className="stat-details">
                        <h4>{stats.total_sales || 0}</h4>
                        <p>Total Orders</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div className="stat-card">
                      <div className="stat-icon pending">
                        <i className="fas fa-handshake"></i>
                      </div>
                      <div className="stat-details">
                        <h4>{businessMetrics.totalB2BOrders}</h4>
                        <p>B2B Orders</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div className="stat-card">
                      <div className="stat-icon users">
                        <i className="fas fa-user"></i>
                      </div>
                      <div className="stat-details">
                        <h4>{businessMetrics.totalB2COrders}</h4>
                        <p>B2C Orders</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div className="stat-card">
                      <div className="stat-icon growth">
                        <i className="fas fa-chart-line"></i>
                      </div>
                      <div className="stat-details">
                        <h4>${businessMetrics.averageOrderSize.toFixed(2)}</h4>
                        <p>Avg Order Size</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div className="stat-card">
                      <div className="stat-icon service">
                        <i className="fas fa-percentage"></i>
                      </div>
                      <div className="stat-details">
                        <h4>{businessMetrics.totalB2BOrders > 0 ? ((businessMetrics.totalB2BOrders / (businessMetrics.totalB2BOrders + businessMetrics.totalB2COrders)) * 100).toFixed(1) : 0}%</h4>
                        <p>B2B Ratio</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="filters-bar mb-3">
                <div className="row">
                  <div className="col-md-3">
                    <input 
                      type="text" 
                      placeholder="Search transactions..." 
                      className="form-control"
                      value={transactionFilters.search}
                      onChange={(e) => setTransactionFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-2">
                    <select 
                      className="form-select"
                      value={transactionFilters.status}
                      onChange={(e) => setTransactionFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <input 
                      type="date" 
                      className="form-control"
                      value={transactionFilters.dateFrom}
                      onChange={(e) => setTransactionFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      placeholder="From Date"
                    />
                  </div>
                  <div className="col-md-2">
                    <input 
                      type="date" 
                      className="form-control"
                      value={transactionFilters.dateTo}
                      onChange={(e) => setTransactionFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      placeholder="To Date"
                    />
                  </div>
                  <div className="col-md-3">
                    <button 
                      className="btn btn-outline-secondary me-2"
                      onClick={() => setTransactionFilters({ search: '', status: '', dateFrom: '', dateTo: '' })}
                    >
                      <i className="fas fa-times me-1"></i>Clear Filters
                    </button>
                  </div>
                </div>
              </div>
              
              {transactions.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-receipt fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No transactions found</p>
                  <small className="text-muted">Transactions will appear here once orders are placed</small>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-search fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No transactions match your filters</p>
                </div>
              ) : (
                <div className="transactions-table-container">
                  <table className="table transactions-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.slice(0, 100).map(transaction => (
                        <tr key={transaction.id}>
                          <td>
                            <strong>#{transaction.sales_id}</strong>
                            <small className="d-block text-muted">ID: {transaction.id}</small>
                          </td>
                          <td>
                            <div>
                              <strong>{transaction.customer_name || 'N/A'}</strong>
                              <small className="d-block text-muted">{transaction.customer_email || 'N/A'}</small>
                              {transaction.customer_type && (
                                <span className="badge bg-light text-dark mt-1">{transaction.customer_type}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong>{transaction.product_name || 'N/A'}</strong>
                              <small className="d-block text-muted">
                                Qty: {transaction.quantity || 1} | Unit: ${parseFloat(transaction.unit_price || 0).toFixed(2)}
                              </small>
                              {transaction.exporter_name && transaction.exporter_name !== 'N/A' && (
                                <small className="d-block text-info">
                                  <i className="fas fa-store me-1"></i>
                                  {transaction.exporter_name}
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              parseFloat(transaction.final_total) >= 1000 ? 'bg-primary' : 'bg-info'
                            }`}>
                              {parseFloat(transaction.final_total) >= 1000 ? 'B2B' : 'B2C'}
                            </span>
                            {transaction.is_b2b_order && (
                              <small className="d-block text-muted mt-1">Bulk Order</small>
                            )}
                          </td>
                          <td>
                            <div>
                              <strong>${parseFloat(transaction.final_total || 0).toFixed(2)}</strong>
                              {transaction.tax_amount > 0 && (
                                <small className="d-block text-muted">Tax: ${parseFloat(transaction.tax_amount).toFixed(2)}</small>
                              )}
                              {transaction.service_fee > 0 && (
                                <small className="d-block text-muted">Fee: ${parseFloat(transaction.service_fee).toFixed(2)}</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              transaction.order_status === 'delivered' ? 'bg-success' :
                              transaction.order_status === 'shipped' ? 'bg-info' :
                              transaction.order_status === 'processing' ? 'bg-warning' :
                              transaction.order_status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {transaction.order_status || 'pending'}
                            </span>
                            {transaction.payment_status && (
                              <small className="d-block text-muted mt-1">
                                Pay: {transaction.payment_status}
                              </small>
                            )}
                          </td>
                          <td>
                            <div>
                              <strong>{new Date(transaction.created_at).toLocaleDateString()}</strong>
                              <small className="d-block text-muted">
                                {new Date(transaction.created_at).toLocaleTimeString()}
                              </small>
                            </div>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button className="btn btn-sm btn-outline-primary" title="View Details">
                                <i className="fas fa-eye"></i>
                              </button>
                              {transaction.order_status === 'pending' && (
                                <button className="btn btn-sm btn-outline-success" title="Process Order">
                                  <i className="fas fa-play"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
