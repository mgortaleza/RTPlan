import apiClient from './client';
import { loadFromStorage, saveToStorage, removeFromStorage } from '../utils/storage';

const AUTH_USER_KEY = 'auth_user';

/**
 * Authenticates user credentials with the backend.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>} AuthResponse
 */
export async function login(username, password) {
  const response = await apiClient.post('/api/auth/login', {
    username: username.trim(),
    password,
  });

  if (response.data && response.data.success) {
    saveToStorage(AUTH_USER_KEY, response.data);
  }

  return response.data;
}

/**
 * Registers a new user account.
 * Newly created accounts default to PENDING status requiring admin approval.
 * @param {Object} data
 * @param {string} data.username
 * @param {string} data.password
 * @param {string} [data.fullName]
 * @param {string} [data.role]
 * @returns {Promise<Object>} AuthResponse
 */
export async function register(data) {
  const response = await apiClient.post('/api/auth/register', {
    username: data.username.trim(),
    password: data.password,
    fullName: (data.fullName || data.username).trim(),
    role: data.role || 'DRIVER',
  });

  return response.data;
}

/**
 * Clears authenticated user session.
 */
export function logout() {
  removeFromStorage(AUTH_USER_KEY);
}

/**
 * Retrieves the currently saved user from localStorage.
 * @returns {Object|null}
 */
export function getStoredUser() {
  return loadFromStorage(AUTH_USER_KEY, null);
}
