import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cert_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    console.error('[API Error]', {
      url: error.config?.url,
      status,
      message,
    });

    if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'] || error.response?.data?.retryAfter || 'a few';
      error.userFriendlyMessage = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
    }

    if (status === 401) {
      try {
        localStorage.removeItem('cert_token');
        localStorage.removeItem('cert_user');
      } catch (e) {
        console.warn('Storage wipe warning:', e);
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
