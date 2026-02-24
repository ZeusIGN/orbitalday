import axios, { AxiosRequestHeaders } from 'axios';

const isProduction = process.env.NODE_ENV === 'production';
const baseURL = isProduction ? 'https://orbital.day/' : 'http://localhost:1987/';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
    accessToken = token;
}

const api = axios.create({
    baseURL,
    withCredentials: true
});

export default api;

export const privateAxios = axios.create({
    baseURL,
    headers: {'Content-Type': 'application/json'},
    withCredentials: true
});

privateAxios.interceptors.request.use(
    config => {
        if (accessToken) {
            const headers = (config.headers || {}) as AxiosRequestHeaders;
            headers["Authorization"] = `Bearer ${accessToken}`;
            config.headers = headers;
        }
        config.withCredentials = true;
        return config;
    },
    error => Promise.reject(error)
);
