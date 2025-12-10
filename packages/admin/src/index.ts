export { AdminApp } from "./App";

export { AuthLayout } from "./components/AuthLayout";
export { Dashboard } from "./components/Dashboard";
export { DashboardLayout } from "./components/DashboardLayout";
export { EntityDetail } from "./components/EntityDetail";
export { EntityForm } from "./components/EntityForm";
export { EntityList } from "./components/EntityList";
export { FileUpload } from "./components/FileUpload";
export { RelationPicker } from "./components/RelationPicker";
export { Sidebar } from "./components/Sidebar";

export { Badge } from "./components/shared/Badge";
export { Button } from "./components/shared/Button";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/shared/Card";
export { Input } from "./components/shared/Input";
export { Label } from "./components/shared/Label";
export {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
  ModalTrigger,
} from "./components/shared/Modal";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./components/shared/Select";
export { Spinner } from "./components/shared/Spinner";
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/shared/Table";
export { Textarea } from "./components/shared/Textarea";

export { useAPIQuery, useAPIMutation } from "./hooks/useAPI";
export { useAuth } from "./hooks/useAuth";
export {
  useEntityCreate,
  useEntityDelete,
  useEntityDetail,
  useEntityList,
  useEntityUpdate,
} from "./hooks/useEntity";
export { useLocalStorage } from "./hooks/useLocalStorage";
export { useManifest } from "./hooks/useManifest";
export { usePagination } from "./hooks/usePagination";
export { useUI } from "./hooks/useUI";

export { apiRequest, createAPIClient, getAPIClient } from "./lib/api";
export {
  clearAuthData,
  decodeJWT,
  isTokenExpired,
  isTokenExpiringSoon,
  loadAuthData,
  saveAuthData,
} from "./lib/auth";
export {
  API_BASE_URL,
  AUTH_TOKEN_KEY,
  DEFAULT_PAGE_SIZE,
  ENTITY_ICONS,
  FIELD_TYPE_ICONS,
  MAX_FILE_SIZE,
  REFRESH_TOKEN_KEY,
  USER_KEY,
} from "./lib/constants";
export type {
  AdminAppProps,
  AuthState,
  EntityFormData,
  EntityListFilters,
  FileUploadResponse,
  ManifestState,
  PaginatedResponse,
  PaginationParams,
  UIState,
  User,
} from "./lib/types";
export {
  camelToTitle,
  capitalizeFirst,
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  truncate,
} from "./lib/utils";
export {
  createEntitySchema,
  createFieldSchema,
  getFieldLabel,
  getFieldPlaceholder,
  getRelatedEntityName,
  isRelationField,
  shouldShowField,
} from "./lib/validation";

export { DashboardPage } from "./pages/DashboardPage";
export { EntityCreatePage } from "./pages/EntityCreatePage";
export { EntityDetailPage } from "./pages/EntityDetailPage";
export { EntityEditPage } from "./pages/EntityEditPage";
export { EntityListPage } from "./pages/EntityListPage";
export { LoginPage } from "./pages/LoginPage";
export { NotFoundPage } from "./pages/NotFoundPage";
export { SettingsPage } from "./pages/SettingsPage";
