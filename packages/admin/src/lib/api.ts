import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";

import type { User } from "./types";

import {
  clearAuthData,
  isTokenExpired,
  loadAuthData,
  saveAuthData,
} from "./auth";
import { API_BASE_URL } from "./constants";

let apiInstance: AxiosInstance | null = null;

export function createAPIClient(baseURL: string = API_BASE_URL): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor - inject auth token
  client.interceptors.request.use(
    (config) => {
      const { token } = loadAuthData();
      if (token && !isTokenExpired(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: unknown) => Promise.reject(error),
  );

  // Response interceptor - handle 401 and refresh token
  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const { refreshToken } = loadAuthData();

        if (refreshToken && !isTokenExpired(refreshToken)) {
          try {
            const response = await axios.post<{
              token: string;
              refreshToken: string;
              user: User;
            }>(`${baseURL}/auth/refresh`, { refreshToken });

            const {
              token: newToken,
              refreshToken: newRefreshToken,
              user,
            } = response.data;
            saveAuthData(newToken, newRefreshToken, user);

            // Retry original request with new token
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return axios.request(error.config);
            }
          } catch {
            clearAuthData();
            window.location.href = "/login";
          }
        } else {
          clearAuthData();
          window.location.href = "/login";
        }
      }

      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "An error occurred";
      toast.error(message);

      return Promise.reject(error);
    },
  );

  return client;
}

export function getAPIClient(): AxiosInstance {
  if (!apiInstance) {
    apiInstance = createAPIClient();
  }
  return apiInstance;
}

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const client = getAPIClient();
  const response = await client.request<T>(config);
  return response.data;
}
