import type { Manifest } from "@baas-workers/usecore";

export interface AdminAppProps {
  apiBaseUrl?: string;
  manifestUrl?: string;
  appName?: string;
  theme?: "light" | "dark";
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export interface UIState {
  sidebarCollapsed: boolean;
  activeEntity: string | null;
  modalOpen: boolean;
  toggleSidebar: () => void;
  setActiveEntity: (entity: string | null) => void;
  setModalOpen: (open: boolean) => void;
}

export interface ManifestState {
  manifest: Manifest | null;
  loading: boolean;
  error: string | null;
  setManifest: (manifest: Manifest) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EntityListFilters {
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface EntityFormData {
  [key: string]: unknown;
}

export interface FileUploadResponse {
  url: string;
  key: string;
  signedUrl?: string;
}
