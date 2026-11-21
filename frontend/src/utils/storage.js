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
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to read "${key}" from localStorage:`, err);
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
  const keys = ['current_step', 'manifest', 'stops', 'opened_legs'];
  keys.forEach((key) => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {}
  });
}
