import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
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
    // Let Axios/browser automatically handle Content-Type & boundary for FormData uploads
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
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
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh") &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;

      try {
        const refreshRes = await api.post("/auth/refresh");
        const newAccessToken = refreshRes.data.access_token;

        if (newAccessToken) {
          localStorage.setItem("token", newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh token failed or expired - clean up stored session
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        const isBuildingOrder =
          window.location.pathname.includes("/sales/assisted-order") ||
          window.location.pathname.includes("/shop");

        if (isBuildingOrder) {
          console.warn(
            "401 Unauthorized encountered during order creation. Cart state preserved in localStorage."
          );
        }

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

