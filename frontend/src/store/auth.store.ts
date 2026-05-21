import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,

  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bgv_token", token);
      localStorage.setItem("bgv_user", JSON.stringify(user));
    }
    set({ user, token, isHydrated: true });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("bgv_token");
      localStorage.removeItem("bgv_user");
    }
    set({ user: null, token: null, isHydrated: true });
  },

  // Read persisted auth on app load (called from a client component)
  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("bgv_token");
    const userStr = localStorage.getItem("bgv_user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isHydrated: true });
        return;
      } catch {
        /* fall through */
      }
    }
    set({ isHydrated: true });
  },
}));
