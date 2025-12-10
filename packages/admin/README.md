# @baas-workers/admin

Production-ready admin UI package for BaaS platform with manifest-driven dynamic forms and dashboard.

## Features

- 🎨 **Dark theme by default** - Beautiful dark UI with Radix UI components
- 📊 **Manifest-driven** - Auto-generates UI from manifest schema
- 🔐 **Authentication** - JWT-based auth with token refresh
- 📝 **Dynamic forms** - Auto-generated forms for all entity types
- 🔍 **Entity management** - Full CRUD operations with pagination
- 📱 **Responsive** - Mobile-first design
- ⚡ **Fast** - Built with Vite, optimized bundle
- 🎯 **Type-safe** - Full TypeScript support

## Installation

```bash
pnpm add @baas-workers/admin
```

## Usage

### Standalone App

```tsx
import { AdminApp } from "@baas-workers/admin";
import "@baas-workers/admin/styles";

export default function App() {
  return (
    <AdminApp apiBaseUrl="http://localhost:8787" appName="My Store Admin" />
  );
}
```

### Individual Components

```tsx
import { DashboardLayout, EntityList, LoginPage } from "@baas-workers/admin";
import "@baas-workers/admin/styles";

function MyCustomAdmin() {
  return <DashboardLayout>{/* Your custom content */}</DashboardLayout>;
}
```

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build library
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Configuration

Set the API base URL via environment variable:

```env
VITE_API_BASE_URL=http://localhost:8787
```

## Architecture

- **React 18+** - Modern React with hooks
- **TypeScript** - Strict type safety
- **Vite** - Fast build and dev server
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## License

MIT
