const AUTH_KEYS = new Set([
  'token',
  'refresh_token',
  'user_type',
  'username',
  'is_superadmin',
  'store_setup_complete',
]);

let patched = false;

export const enableTabScopedAuth = () => {
  if (patched || typeof window === 'undefined') return;
  patched = true;

  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.getItem = function getItem(key) {
    if (this === window.localStorage && AUTH_KEYS.has(key)) {
      return originalGetItem.call(window.sessionStorage, key);
    }
    return originalGetItem.call(this, key);
  };

  Storage.prototype.setItem = function setItem(key, value) {
    if (this === window.localStorage && AUTH_KEYS.has(key)) {
      return originalSetItem.call(window.sessionStorage, key, value);
    }
    return originalSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function removeItem(key) {
    if (this === window.localStorage && AUTH_KEYS.has(key)) {
      originalRemoveItem.call(window.sessionStorage, key);
      return originalRemoveItem.call(window.localStorage, key);
    }
    return originalRemoveItem.call(this, key);
  };
};
