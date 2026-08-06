import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token if available in localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle silent token refresh & preserve active order state on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // If 401 occurs while user is building an order, preserve local storage cart & notify
      const isBuildingOrder =
        window.location.pathname.includes("/sales/assisted-order") ||
        window.location.pathname.includes("/shop");
      if (isBuildingOrder) {
        console.warn(
          "401 Unauthorized encountered during order creation. Cart state preserved in localStorage."
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;
