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
  logout: () => void;
  initialize: () => void;
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
          // Import api dynamically to avoid circular dependencies
          const { default: api } = await import("@/lib/api");
          await api.get("/settings/profile");
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

export const useAuthStore = create<AuthState>((set) => ({
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
  logout: () => {
    stopKeepAlive();
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
  initialize: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ token, user, isAuthenticated: true });
          startKeepAlive();
        } catch {
          // If stored JSON is corrupt, clean up localStorage
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          set({ token: null, user: null, isAuthenticated: false });
        }
      }
    }
  },
}));
