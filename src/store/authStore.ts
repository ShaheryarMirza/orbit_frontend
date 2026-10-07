import { create } from "zustand";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  must_change_password: boolean;
  is_approved: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

let refreshInterval: NodeJS.Timeout | null = null;

const startKeepAlive = () => {
  if (refreshInterval) clearInterval(refreshInterval);
  if (typeof window !== "undefined") {
    // Run a silent keep-alive check every 10 minutes to keep JWT active & prevent session timeouts
    refreshInterval = setInterval(async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { default: api } = await import("@/lib/api");
          await api.get("/auth/me");
        } catch (err) {
          console.warn("Silent auth keep-alive refresh attempt:", err);
        }
      }
    }, 10 * 60 * 1000); // 10 minutes
  }
};

const stopKeepAlive = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (token, user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ token, user, isAuthenticated: true });
    startKeepAlive();
  },
  logout: async () => {
    stopKeepAlive();
    if (typeof window !== "undefined") {
      try {
        const { default: api } = await import("@/lib/api");
        await api.post("/auth/logout");
      } catch (err) {
        console.warn("Server logout request failed:", err);
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
  initialize: async () => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    // Fast-path: Set state immediately if local storage cache exists
    if (storedToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token: storedToken, user, isAuthenticated: true });
        startKeepAlive();
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    // Silent refresh attempt via HttpOnly cookie to restore or refresh active session
    try {
      const { default: api } = await import("@/lib/api");
      const refreshRes = await api.post("/auth/refresh");
      const newAccessToken = refreshRes.data.access_token;

      if (newAccessToken) {
        localStorage.setItem("token", newAccessToken);
        const meRes = await api.get("/auth/me");
        const freshUser = meRes.data;

        localStorage.setItem("user", JSON.stringify(freshUser));
        set({ token: newAccessToken, user: freshUser, isAuthenticated: true });
        startKeepAlive();
      }
    } catch (err: any) {
      // Only clear auth state if backend explicitly returned 401 or 403 (token truly expired/invalid).
      // Network errors, server restarts, or offline glitches will NOT log the user out.
      const isExplicitAuthFailure =
        err.response?.status === 401 ||
        err.response?.status === 403;

      if (isExplicitAuthFailure) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ token: null, user: null, isAuthenticated: false });
      } else {
        console.warn(
          "Initial silent session refresh encountered a network issue. Preserving active session:",
          err.message || err
        );
      }
    }
  },
}));


