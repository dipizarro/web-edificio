import axios from "axios";
import { clearToken } from "../auth/authStore";
import { toast } from "sonner";

const baseURL = import.meta.env.VITE_API_BASE_URL as string;

export const api = axios.create({
    baseURL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("coreedificio_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearToken();
            toast.error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
            window.location.href = "/login";
        } else if (error.response?.status === 403) {
            window.location.href = "/forbidden";
        }
        return Promise.reject(error);
    }
);
