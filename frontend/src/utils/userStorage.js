/**
 * User-Scoped LocalStorage Utility
 * 
 * Provides isolated storage methods ensuring that personal execution state
 * (such as timers, active task bindings, retrievable sessions, and UI preferences)
 * are strictly bound to the authenticated user ID and never leak across accounts.
 */

export const getActiveUserId = () => {
  try {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?._id || user?.id || null;
    }
  } catch (e) {
    console.error("Error reading currentUser from localStorage", e);
  }
  return null;
};

export const getScopedKey = (key, userId = null) => {
  const uid = userId || getActiveUserId();
  return uid ? `${key}_${uid}` : key;
};

export const getScopedItem = (key, userId = null) => {
  const scopedKey = getScopedKey(key, userId);
  return localStorage.getItem(scopedKey);
};

export const setScopedItem = (key, value, userId = null) => {
  const scopedKey = getScopedKey(key, userId);
  const valStr = typeof value === "string" ? value : JSON.stringify(value);
  localStorage.setItem(scopedKey, valStr);
};

export const removeScopedItem = (key, userId = null) => {
  const scopedKey = getScopedKey(key, userId);
  localStorage.removeItem(scopedKey);
};
