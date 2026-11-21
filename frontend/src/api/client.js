import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
        message = `Cannot reach backend at ${API_BASE_URL}. Ensure Spring Boot is running.`;
      } else {
        message = error.message;
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
