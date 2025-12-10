import { create } from "zustand";

import type { AuthState, User } from "../lib/types";

import { clearAuthData, loadAuthData, saveAuthData } from "../lib/auth";

export const useAuthStore = create<AuthState>((set) => {
  // Load initial auth data from localStorage
  const { token, refreshToken, user } = loadAuthData();

  return {
    user,
    token,
    refreshToken,
    isAuthenticated: Boolean(token && user),

    login: (newToken: string, newRefreshToken: string, newUser: User) => {
      saveAuthData(newToken, newRefreshToken, newUser);
      set({
        token: newToken,
        refreshToken: newRefreshToken,
        user: newUser,
        isAuthenticated: true,
      });
    },

    logout: () => {
      clearAuthData();
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    },

    setUser: (newUser: User) => {
      const { token, refreshToken } = loadAuthData();
      if (token && refreshToken) {
        saveAuthData(token, refreshToken, newUser);
      }
      set({ user: newUser });
    },
  };
});

export const useAuth = () => useAuthStore();
