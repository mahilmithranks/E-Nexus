import axios from 'axios';

// Helper to handle missing protocol in VITE_API_URL
const getBaseUrl = () => {
    const url = import.meta.env.VITE_API_URL;
    if (url) {
        if (url.startsWith('http')) return url;
        return `https://${url}`;
    }
    // Default to relative /api for local dev (Vite proxy) and Vercel monorepo setups
    return '/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;
