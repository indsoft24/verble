// src/services/apiClient.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/** Default timeout for normal API calls (uploads override per-request). */
const DEFAULT_TIMEOUT_MS = 60000;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
    },
});

const RETRYABLE_METHODS = new Set(['get', 'head']);
const MAX_GET_RETRIES = 2;

function isRetryableError(error: AxiosError): boolean {
    if (!error.config) return false;
    const method = (error.config.method || 'get').toLowerCase();
    if (!RETRYABLE_METHODS.has(method)) return false;
    if (error.code === 'ECONNABORTED') return true;
    const status = error.response?.status;
    return status === 502 || status === 503 || status === 504;
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Let the browser set multipart boundary — manual Content-Type breaks uploads (esp. Safari).
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
        if (!config || !isRetryableError(error)) {
            return Promise.reject(error);
        }
        config._retryCount = config._retryCount ?? 0;
        if (config._retryCount >= MAX_GET_RETRIES) {
            return Promise.reject(error);
        }
        config._retryCount += 1;
        await delay(400 * config._retryCount);
        return apiClient.request(config);
    }
);

export default apiClient;
