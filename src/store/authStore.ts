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
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
  initialize: () => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (storedToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token: storedToken, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ token: null, user: null, isAuthenticated: false });
      }
    } else {
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));



