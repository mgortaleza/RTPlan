import apiClient from './client';

/**
 * Extracts delivery addresses from uploaded manifest screenshot images.
 * @param {File[]} files Array of image Files
 * @returns {Promise<string[]>} Array of extracted address strings
 */
export async function extractAddresses(files) {
  if (!files || files.length === 0) {
    throw new Error('Please select at least one image file.');
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await apiClient.post('/api/routes/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Optimizes the route sequence (TSP), generates chunked deep links, and persists to SQL Server.
 * @param {Object} payload { driverId, routeDate, stops: [{ originalExtractedText, correctedAddress, isManuallyEdited }] }
 * @returns {Promise<Object>} ManifestResponse
 */
export async function optimizeRoute(payload) {
  if (!payload.stops || payload.stops.length === 0) {
    throw new Error('At least one stop must be provided for route optimization.');
  }

  const formattedPayload = {
    driverId: payload.driverId || 1,
    routeDate: payload.routeDate || new Date().toISOString().split('T')[0],
    stops: payload.stops.map((stop) => ({
      originalExtractedText: stop.originalExtractedText || stop.correctedAddress,
      correctedAddress: stop.correctedAddress,
      isManuallyEdited: Boolean(stop.isManuallyEdited),
    })),
  };

  const response = await apiClient.post('/api/routes/optimize', formattedPayload);
  return response.data;
}

/**
 * Retrieves a previously saved manifest by ID with its ordered stops and chunked navigation links.
 * @param {number|string} id Manifest ID
 * @returns {Promise<Object>} ManifestResponse
 */
export async function getManifest(id) {
  const response = await apiClient.get(`/api/routes/manifests/${id}`);
  return response.data;
}

/**
 * Retrieves the most recent route manifests from the backend database.
 * @returns {Promise<Array>} List of ManifestResponse objects
 */
export async function getRecentManifests() {
  const response = await apiClient.get('/api/routes/manifests');
  return response.data;
}

/**
 * Fetches the list of active drivers from the database.
 * @returns {Promise<Array>} List of DriverResponse objects
 */
export async function getActiveDrivers() {
  try {
    const response = await apiClient.get('/api/drivers');
    return response.data;
  } catch {
    // Return fallback default driver if list fails
    return [{ driverId: 1, fullName: 'Primary Driver', isActive: true }];
  }
}

/**
 * Health check to verify Spring Boot connection.
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
  try {
    await apiClient.get('/api');
    return true;
  } catch {
    try {
      await apiClient.get('/');
      return true;
    } catch {
      return false;
    }
  }
}
