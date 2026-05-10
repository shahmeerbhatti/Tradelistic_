import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAllProducts, getCart, getNotifications, markNotificationRead } from '../services/api';
import { CATEGORY_OPTIONS } from '../utils/categoryConstants';
import tradelisticLogo from '../Tradelistic Logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isScrolled, setIsScrolled] = useState(false);

  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const userType = localStorage.getItem('user_type');
  const isAuthenticated = Boolean(token);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    let frameId = null;
    let lastScrolled = false;
    const handleScroll = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const scrollTop = Math.max(
          window.scrollY || 0,
          document.documentElement.scrollTop || 0,
          document.body.scrollTop || 0
        );
        const nextScrolled = scrollTop > 8;
        if (nextScrolled !== lastScrolled) {
          lastScrolled = nextScrolled;
          setIsScrolled(nextScrolled);
          document.documentElement.classList.toggle('is-page-scrolled', nextScrolled);
        }
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    document.body.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      document.documentElement.classList.remove('is-page-scrolled');
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('scroll', handleScroll, { capture: true });
      document.body.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, []);

  useEffect(() => {
    setShowSearch(false);
    setShowCategories(false);
    setShowUser(false);
    setShowNotifications(false);
    setSearch('');
  }, [location.pathname]);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated || userType !== 'importer') {
      setCartCount(0);
      return;
    }

    try {
      const response = await getCart();
      setCartCount(response.data.cart?.items?.length || 0);
    } catch {
      setCartCount(0);
    }
  }, [isAuthenticated, userType]);

  useEffect(() => {
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, [loadCart]);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const response = await getNotifications();
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 45000);
    window.addEventListener('notificationsUpdated', loadNotifications);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('notificationsUpdated', loadNotifications);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const closeSearch = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', closeSearch);
    return () => document.removeEventListener('mousedown', closeSearch);
  }, []);

  const runSearch = useCallback(async (term) => {
    if (term.trim().length < 2) {
      setSuggestions([]);
      setShowSearch(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await getAllProducts({ name: term.trim() });
      const data = response.data.results || response.data || [];
      setSuggestions(data.slice(0, 5));
      setShowSearch(true);
    } catch {
      setSuggestions([]);
      setShowSearch(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => runSearch(value), 280);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (!search.trim()) return;
    navigate(`/products?name=${encodeURIComponent(search.trim())}`);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('username');
    navigate('/');
  };

  const openCart = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart', message: 'Please sign in to view your cart' } });
      return;
    }
    navigate('/cart');
  };

  const openNotification = async (notification) => {
    try {
      await markNotificationRead(notification.id);
      loadNotifications();
    } catch {
      // Notification read state is non-blocking for navigation.
    }

    if (notification.offer) {
      navigate(`/offers?offer=${notification.offer}`);
    } else if (notification.product_id) {
      navigate(`/product/${notification.product_id}`);
    }
  };

  const toggleNotifications = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname, message: 'Please sign in to view notifications' } });
      return;
    }
    setShowNotifications((value) => !value);
  };

  const navButton = 'inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 dark:border-white/10 dark:bg-white/8 dark:text-white';

  return (
    <header className={`fresh-navbar ${isScrolled ? 'fresh-navbar-scrolled' : ''} sticky top-0 z-50 border-b border-transparent px-4 py-3 md:px-8`}>
      <nav className="mx-auto grid max-w-[1480px] grid-cols-1 items-center gap-3 xl:grid-cols-[auto_minmax(420px,1fr)_auto]">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="group inline-flex items-center gap-3 no-underline">
            <span className="grid h-14 w-14 place-items-center overflow-hidden transition group-hover:-translate-y-0.5">
              <img src={tradelisticLogo} alt="TradeListic logo" className="h-full w-full object-contain" />
            </span>
            <span>
              <span className="block text-lg font-black tracking-none text-slate-950 dark:text-white">TRADELISTIC</span>
              <span className="block text-xs font-semibold text-slate-500 dark:text-blue-100">Modern trade marketplace</span>
            </span>
          </Link>

          <div
            className="fresh-category-dropdown-wrap"
            onMouseEnter={() => setShowCategories(true)}
            onMouseLeave={() => setShowCategories(false)}
          >
            <button type="button" className={navButton} onClick={() => setShowCategories((value) => !value)}>
              <i className="fas fa-th-large" aria-hidden="true"></i>
              Categories
            </button>

            {showCategories && (
              <div className="fresh-category-menu">
                <button type="button" className="fresh-category-card-primary" onClick={() => navigate('/products')}>
                  <span>All Products</span>
                  <small>Complete marketplace</small>
                </button>
                {CATEGORY_OPTIONS.map((category) => (
                  <button key={category.value} type="button" className="fresh-category-card" onClick={() => navigate(`/products?category=${category.value}`)}>
                    <i className={category.icon} aria-hidden="true"></i>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative" ref={searchRef}>
          <form onSubmit={submitSearch} className="fresh-search-form flex h-[52px] items-center rounded-[20px] border border-blue-100 bg-white shadow-[0_14px_34px_rgba(49,91,210,0.10)] dark:border-white/10 dark:bg-white/8">
            <span className="fresh-search-icon grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-white/10 dark:text-blue-200">
              <i className="fas fa-search" aria-hidden="true"></i>
            </span>
            <input
              className="fresh-search-input h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-blue-100/70"
              type="search"
              name="search"
              value={search}
              onChange={handleSearchChange}
              onFocus={() => search.trim().length >= 2 && setShowSearch(true)}
              placeholder="Search laptops, apparel, home goods..."
              aria-label="Search products"
            />
            <button className="fresh-search-button h-10 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700" type="submit">
              {isSearching ? <i className="fas fa-spinner fa-spin" aria-hidden="true"></i> : 'Search'}
            </button>
          </form>

          {showSearch && (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-3xl border border-blue-100 bg-white p-2 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-slate-900">
              {suggestions.length ? suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-blue-50 dark:hover:bg-white/10"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 dark:bg-white/10">
                    {item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-contain p-2" /> : <i className="fas fa-box text-blue-500" aria-hidden="true"></i>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-950 dark:text-white">{item.name}</span>
                    <span className="block text-xs font-semibold text-blue-700 dark:text-blue-200">${item.price} · {item.category}</span>
                  </span>
                </button>
              )) : (
                <div className="p-5 text-sm font-semibold text-slate-500 dark:text-blue-100">No products found. Try another keyword.</div>
              )}
              {search.trim().length >= 2 && (
                <button type="button" className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white" onClick={() => navigate(`/products?name=${encodeURIComponent(search.trim())}`)}>
                  View all results
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-100 bg-white text-slate-950 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/8 dark:text-white"
            onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark theme"
          >
            <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} aria-hidden="true"></i>
          </button>

          <div className="relative">
            <button
              type="button"
              className="fresh-cart-button relative grid h-11 w-11 place-items-center rounded-2xl border border-blue-100 bg-white text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 dark:border-white/10 dark:bg-white/8 dark:text-white"
              onClick={toggleNotifications}
              aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            >
              <i className="fas fa-bell" aria-hidden="true"></i>
              {unreadCount > 0 && <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1 text-xs text-white">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="fresh-notification-menu absolute right-0 top-[calc(100%+10px)] z-50 w-[min(360px,88vw)] rounded-3xl border border-blue-100 bg-white p-3 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-slate-900">
                <div className="mb-2 flex items-center justify-between gap-3 px-2">
                  <span className="text-sm font-black text-slate-950 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="text-xs font-black text-blue-700 dark:text-blue-200"
                      onClick={async () => {
                        await markNotificationRead('all');
                        loadNotifications();
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[380px] space-y-2 overflow-y-auto">
                  {notifications.length ? notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full rounded-2xl p-3 text-left transition hover:bg-blue-50 dark:hover:bg-white/10 ${item.is_read ? 'bg-transparent' : 'bg-blue-50 dark:bg-white/10'}`}
                      onClick={() => openNotification(item)}
                    >
                      <span className="flex items-start gap-3">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white">
                          <i className="fas fa-handshake" aria-hidden="true"></i>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-black text-slate-950 dark:text-white">{item.title}</span>
                          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500 dark:text-blue-100">{item.message}</span>
                        </span>
                      </span>
                    </button>
                  )) : (
                    <div className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-slate-500 dark:bg-white/10 dark:text-blue-100">No notifications yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="fresh-cart-button relative inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 dark:border-white/10 dark:bg-white/8 dark:text-white"
            onClick={openCart}
            aria-label={`Open cart${cartCount ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`}
          >
            <i className="fas fa-shopping-bag" aria-hidden="true"></i>
            <span>Cart</span>
            {cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1 text-xs text-white">{cartCount}</span>}
          </button>

          {userType === 'exporter' && (
            <Link to="/add-product" className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white no-underline shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:text-white">
              <i className="fas fa-plus" aria-hidden="true"></i>
              Add Product
            </Link>
          )}

          {isAuthenticated ? (
            <div className="relative">
              <button type="button" className={navButton} onClick={() => setShowUser((value) => !value)}>
                <i className="fas fa-user-circle" aria-hidden="true"></i>
                {username || 'Account'}
              </button>
              {showUser && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-52 rounded-3xl border border-blue-100 bg-white p-2 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-slate-900">
                  <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">{userType}</div>
                  {userType === 'importer' && (
                    <button type="button" className="w-full rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-900 transition hover:bg-blue-50 dark:text-white dark:hover:bg-white/10" onClick={() => navigate('/offers')}>
                      <i className="fas fa-handshake mr-2" aria-hidden="true"></i>
                      My offers
                    </button>
                  )}
                  <button type="button" className="w-full rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-900 transition hover:bg-blue-50 dark:text-white dark:hover:bg-white/10" onClick={logout}>
                    <i className="fas fa-right-from-bracket mr-2" aria-hidden="true"></i>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white no-underline shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:text-white">
              Sign in
            </Link>
          )}
        </div>
      </nav>

    </header>
  );
};

export default Navbar;
