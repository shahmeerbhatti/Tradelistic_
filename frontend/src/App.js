import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ExporterGuard from './components/ExporterGuard';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AddProduct from './pages/AddProduct';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import PublicStore from './pages/PublicStore';
import StoreSetup from './pages/StoreSetup';
import ExporterDashboard from './pages/ExporterDashboard';
import ExporterStore from './pages/ExporterStore';
import EditProduct from './pages/EditProduct';
import Analytics from './pages/Analytics';
import ExportGuide from './pages/ExportGuide';
import SuccessfulSale from './pages/SuccessfulSale';
import Cart from './pages/Cart';
import ImporterOffers from './pages/ImporterOffers';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminLogin from './pages/SuperAdminLogin';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/FreshFrontend.css';
import './styles/RetailPlatform.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Separate Super Admin access point */}
          <Route path="/admin-login" element={<SuperAdminLogin />} />

          {/* Super Admin Dashboard - no navbar (has its own) */}
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          
          {/* Store setup route - no navbar, no guard */}
          <Route path="/store-setup" element={<StoreSetup />} />
          
          {/* Exporter Dashboard - no navbar needed (has its own header) */}
          <Route path="/exporter-dashboard" element={
            <ExporterGuard>
              <ExporterDashboard />
            </ExporterGuard>
          } />
          
          {/* Exporter Store - no navbar needed (has its own header) */}
          <Route path="/exporter-store" element={
            <ExporterGuard>
              <ExporterStore />
            </ExporterGuard>
          } />
          
          {/* Edit Product - no navbar needed (has its own header) */}
          <Route path="/edit-product/:id" element={
            <ExporterGuard>
              <EditProduct />
            </ExporterGuard>
          } />
          
          {/* Analytics - no navbar needed (has its own header) */}
          <Route path="/analytics" element={
            <ExporterGuard>
              <Analytics />
            </ExporterGuard>
          } />

          <Route path="/export-guide" element={
            <ExporterGuard>
              <ExportGuide />
            </ExporterGuard>
          } />
          
          {/* Login and Signup - no guard needed */}
          <Route path="/login" element={
            <>
              <Navbar />
              <main className="fresh-page-frame fresh-auth-frame">
                <Login />
              </main>
            </>
          } />
          
          <Route path="/signup" element={
            <>
              <Navbar />
              <main className="fresh-page-frame fresh-auth-frame">
                <Signup />
              </main>
            </>
          } />
          
          {/* Protected routes with ExporterGuard */}
          <Route path="/" element={
            <>
              <Navbar />
              <main className="fresh-page-frame">
                <Home />
              </main>
            </>
          } />
          
          <Route path="/add-product" element={
            <ExporterGuard>
              <AddProduct />
            </ExporterGuard>
          } />
          
          <Route path="/products" element={
            <>
              <Navbar />
              <main className="fresh-page-frame">
                <Products />
              </main>
            </>
          } />
          
          <Route path="/product/:id" element={
            <>
              <Navbar />
              <main className="fresh-page-frame">
                <ProductDetail />
              </main>
            </>
          } />
          
          <Route path="/store/:storeId" element={
            <>
              <Navbar />
              <main className="fresh-page-frame">
                <PublicStore />
              </main>
            </>
          } />
          
          <Route path="/cart" element={
            <>
              <Navbar />
              <ExporterGuard>
                <Cart />
              </ExporterGuard>
            </>
          } />

          <Route path="/offers" element={
            <>
              <Navbar />
              <main className="fresh-page-frame">
                <ImporterOffers />
              </main>
            </>
          } />
          
          <Route path="/successful-sale" element={
            <ExporterGuard>
              <SuccessfulSale />
            </ExporterGuard>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
