/**
 * LocalStorage wrapper with error handling and JSON serialization.
 * Safely persists route, stops, and manifest state across mobile browser
 * backgrounding, reloads, and navigation.
 */

const STORAGE_PREFIX = 'rtplan_';

export function loadFromStorage(key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (
      raw === null ||
      raw === undefined ||
      raw === '' ||
      raw === 'undefined' ||
      raw === 'null'
    ) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn(`Failed to read "${key}" from localStorage, resetting corrupted key:`, err);
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {}
    return fallback;
  }
}

export function saveToStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } else {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    }
  } catch (err) {
    console.warn(`Failed to save "${key}" to localStorage:`, err);
  }
}

export function removeFromStorage(key) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (err) {
    console.warn(`Failed to remove "${key}" from localStorage:`, err);
  }
}

export function clearRouteStorage() {
  if (typeof window === 'undefined') return;
  const keys = ['current_step', 'manifest', 'stops', 'opened_legs', 'completed_legs'];
  keys.forEach((key) => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {}
  });
}

/**
 * Completely clears all application and user cache from localStorage and sessionStorage.
 * Used during logout to prevent any user data crossover on shared devices.
 */
export function clearAllUserStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (err) {
    console.warn('Failed to clear user storage on logout:', err);
  }
}
