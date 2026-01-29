import axios from 'axios';

const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.endsWith('.local')
);

const envApiUrl = import.meta.env.VITE_API_URL;
const isEnvLocalhost = envApiUrl && envApiUrl.includes('localhost');

const API_URL = (isLocal)
    ? `http://${window.location.hostname}:5005/api`
    : (isEnvLocalhost ? 'https://trio-app-server.onrender.com/api' : (envApiUrl || 'https://trio-app-server.onrender.com/api'));

console.log('Current API URL:', API_URL);

// Double check for Pages.dev mismatch
let finalApiUrl = API_URL;
if (!isLocal && API_URL.includes('localhost')) {
    console.warn('⚠️ Critical: Localhost API config detected on Production! switching to Render.');
    finalApiUrl = 'https://trio-app-server.onrender.com/api';
}

// (Duplicate block removed)

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
