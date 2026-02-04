// src/config/apiConfig.js
// Automatically detects and uses the correct API URL

const getApiUrl = () => {
  // Priority 1: Environment variable (set in .env.local or build config)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Priority 2: Auto-detect based on current environment
  const hostname = window.location.hostname;

  // If running on localhost, use localhost API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }

  // For all other cases (production), use production API
  return 'https://power-loom-production-monitoring-app.onrender.com/api';
};

export const API_URL = getApiUrl();

// Log the API URL being used (helpful for debugging)
console.log('🔗 API URL:', API_URL);

export default API_URL;