import axios from 'axios';

const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.endsWith('.local')
);

const API_URL = import.meta.env.VITE_API_URL || (isLocal ? `http://${window.location.hostname}:5005/api` : 'https://trio-app-server.onrender.com/api');

console.log('Current API URL:', API_URL);

// Simple safety check for Pages.dev + localhost mismatch
let finalApiUrl = API_URL;
if (typeof window !== 'undefined' && window.location.hostname.includes('pages.dev') && (API_URL.includes('localhost'))) {
    console.warn('⚠️ Detected localhost API config on production! Auto-correcting to Render API.');
    finalApiUrl = 'https://trio-app-server.onrender.com/api';
}

const api = axios.create({
    baseURL: finalApiUrl,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Authentication error (401), logging out...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Redirect to login if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
