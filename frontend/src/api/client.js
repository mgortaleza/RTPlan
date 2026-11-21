import axios from 'axios';

// When running in a browser on a mobile device or other LAN machine,
// use a relative URL so requests hit Vite's local proxy (/api -> :8080)
// avoiding firewall/CORS friction across the Wi-Fi network.
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      return ''; // Use relative path to leverage Vite's reverse proxy
    }
  }
  return envUrl || 'http://localhost:8080';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 45000, // 45 seconds for OCR / TSP processing
  headers: {
    'Accept': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      if (error.code === 'ECONNABORTED') {
        message = 'Request timed out while communicating with the routing server.';
      } else if (error.message.includes('Network Error')) {
        message = 'Cannot reach backend server. Ensure Spring Boot is running.';
      } else {
        message = error.message;
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
