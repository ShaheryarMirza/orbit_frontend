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

// Token refresh queue and locking mechanism to avoid concurrent refresh collisions
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle silent token refresh & preserve active state on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 Unauthorized errors from non-auth endpoints
    if (
      !error.response ||
      error.response.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      typeof window === "undefined"
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in-flight, pause and queue this request until completed
    if (isRefreshing) {
      return new Promise<any>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshRes = await api.post("/auth/refresh");
      const newAccessToken = refreshRes.data?.access_token;

      if (newAccessToken) {
        localStorage.setItem("token", newAccessToken);
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } else {
        throw new Error("No access token returned from refresh endpoint");
      }
    } catch (refreshErr: any) {
      processQueue(refreshErr, null);

      // Redirect to /login ONLY if the refresh call explicitly returns a 401 or 403
      // Network errors, server 5xx, or offline events are handled gracefully without logging out
      const isExplicitAuthFailure =
        refreshErr.response?.status === 401 ||
        refreshErr.response?.status === 403;

      if (isExplicitAuthFailure) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        const isBuildingOrder =
          window.location.pathname.includes("/sales/assisted-order") ||
          window.location.pathname.includes("/shop");

        if (isBuildingOrder) {
          console.warn(
            "Session expired during order creation. Cart state preserved in localStorage."
          );
        }

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      } else {
        console.warn(
          "Silent auth refresh encountered a network or connectivity issue. Session preserved:",
          refreshErr.message || refreshErr
        );
      }

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;


