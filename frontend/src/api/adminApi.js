import apiClient from './client';

/**
 * Fetches all users from the system.
 * @returns {Promise<Array>} List of UserResponse objects
 */
export async function listUsers() {
  const response = await apiClient.get('/api/admin/users');
  return response.data;
}

/**
 * Fetches pending access requests.
 * @returns {Promise<Array>} List of UserResponse objects with status PENDING
 */
export async function listPendingUsers() {
  const response = await apiClient.get('/api/admin/users/pending');
  return response.data;
}

/**
 * Creates a new user in the system.
 * @param {Object} userData
 * @returns {Promise<Object>} UserResponse
 */
export async function createUser(userData) {
  const response = await apiClient.post('/api/admin/users', userData);
  return response.data;
}

/**
 * Updates an existing user's details, role, status, or password.
 * @param {number|string} userId
 * @param {Object} userData
 * @returns {Promise<Object>} UserResponse
 */
export async function updateUser(userId, userData) {
  const response = await apiClient.put(`/api/admin/users/${userId}`, userData);
  return response.data;
}

/**
 * Deletes a user by ID.
 * @param {number|string} userId
 * @param {string} requestingUser
 * @returns {Promise<Object>}
 */
export async function deleteUser(userId, requestingUser) {
  const response = await apiClient.delete(`/api/admin/users/${userId}`, {
    params: { requestingUser },
  });
  return response.data;
}

/**
 * Approves a pending user access request.
 * @param {number|string} userId
 * @param {string} [role]
 * @returns {Promise<Object>} UserResponse
 */
export async function approveUser(userId, role) {
  const params = role ? { role } : {};
  const response = await apiClient.post(`/api/admin/users/${userId}/approve`, null, { params });
  return response.data;
}

/**
 * Rejects a user access request.
 * @param {number|string} userId
 * @returns {Promise<Object>} UserResponse
 */
export async function rejectUser(userId) {
  const response = await apiClient.post(`/api/admin/users/${userId}/reject`);
  return response.data;
}

/**
 * Fetches real-time server, database, and application health & metrics.
 * @returns {Promise<Object>} SystemMetricsResponse
 */
export async function getSystemMetrics() {
  const response = await apiClient.get('/api/admin/metrics');
  return response.data;
}
