export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export const AUTH_TOKEN_KEY = "baas_admin_token";
export const REFRESH_TOKEN_KEY = "baas_admin_refresh_token";
export const USER_KEY = "baas_admin_user";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ENTITY_ICONS: Record<string, string> = {
  Store: "Store",
  User: "Users",
  Product: "Package",
  Order: "ShoppingCart",
  Customer: "UserCircle",
  Category: "FolderTree",
  default: "FileText",
};

export const FIELD_TYPE_ICONS: Record<string, string> = {
  string: "Type",
  email: "Mail",
  number: "Hash",
  integer: "Hash",
  decimal: "DollarSign",
  boolean: "ToggleLeft",
  date: "Calendar",
  datetime: "CalendarClock",
  timestamp: "Clock",
  text: "AlignLeft",
  enum: "List",
  uuid: "Key",
  file: "FileUp",
  image: "Image",
  default: "FileText",
};
