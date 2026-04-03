import axios from 'axios';
import SecureStore from '../utils/SecureStore';
import Constants from 'expo-constants';

// Function to dynamically determine the base URL
const getBaseUrl = () => {
    // 1. If an environment variable is set, use it
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // 2. Automatically detect development server IP from Expo
    // This dynamically gets your computer's local IP address (e.g., 192.168.1.5)
    // and solves the issue of the IP changing after a break or network change.
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
        const ipAddress = debuggerHost.split(':')[0];
        return `http://${ipAddress}:8000/api`;
    }

    // 3. Fallback to a hardcoded local IP if not running in Expo development mode
    return 'http://10.60.242.147:8000/api'; 
};

const BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add JWT token to every request
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Interceptor to handle token expiration (401 errors)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            // Token might be expired, you could trigger a logout here
            console.log("Token expired or unauthorized");
            await SecureStore.deleteItemAsync('userToken');
        }
        return Promise.reject(error);
    }
);

export default api;
