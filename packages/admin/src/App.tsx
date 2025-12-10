import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { Toaster } from "sonner";

import type { AdminAppProps } from "./lib/types";

import { DashboardLayout } from "./components/DashboardLayout";
import { useAuth } from "./hooks/useAuth";
import { useManifest } from "./hooks/useManifest";
import { DashboardPage } from "./pages/DashboardPage";
import { EntityCreatePage } from "./pages/EntityCreatePage";
import { EntityDetailPage } from "./pages/EntityDetailPage";
import { EntityEditPage } from "./pages/EntityEditPage";
import { EntityListPage } from "./pages/EntityListPage";
import { LoginPage } from "./pages/LoginPage";
import { SettingsPage } from "./pages/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

type ViewMode = "dashboard" | "list" | "create" | "edit" | "detail" | "settings";

interface AppState {
  mode: ViewMode;
  entity: string | null;
  id: string | null;
}

export function AdminApp(props: AdminAppProps) {
  // Props available for future use: apiBaseUrl, manifestUrl, appName, theme
  void props;
  const { isAuthenticated } = useAuth();
  const [appState, setAppState] = React.useState<AppState>({
    mode: "dashboard",
    entity: null,
    id: null,
  });

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" richColors />
        <LoginPage
          onSuccess={() => {
            setAppState({ mode: "dashboard", entity: null, id: null });
          }}
        />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <AppContent appState={appState} setAppState={setAppState} />
    </QueryClientProvider>
  );
}

interface AppContentProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

function AppContent({ appState, setAppState }: AppContentProps) {
  const { manifest } = useManifest();

  const currentEntity = React.useMemo(() => {
    if (!appState.entity || !manifest) return null;
    return manifest.entities?.find((e) => e.name === appState.entity) ?? null;
  }, [appState.entity, manifest]);

  const renderContent = () => {
    switch (appState.mode) {
      case "dashboard":
        return (
          <DashboardPage
            onEntityClick={(entityName) => {
              setAppState({ mode: "list", entity: entityName, id: null });
            }}
          />
        );

      case "list":
        if (!currentEntity) return <div>Entity not found</div>;
        return (
          <EntityListPage
            entity={currentEntity}
            onCreateClick={() => {
              setAppState({ ...appState, mode: "create" });
            }}
            onViewClick={(id) => {
              setAppState({ ...appState, mode: "detail", id });
            }}
            onEditClick={(id) => {
              setAppState({ ...appState, mode: "edit", id });
            }}
          />
        );

      case "create":
        if (!currentEntity) return <div>Entity not found</div>;
        return (
          <EntityCreatePage
            entity={currentEntity}
            onSuccess={() => {
              setAppState({ ...appState, mode: "list" });
            }}
            onCancel={() => {
              setAppState({ ...appState, mode: "list" });
            }}
          />
        );

      case "edit":
        if (!currentEntity || !appState.id) return <div>Entity or ID not found</div>;
        return (
          <EntityEditPage
            entity={currentEntity}
            id={appState.id}
            onSuccess={() => {
              setAppState({ ...appState, mode: "list" });
            }}
            onCancel={() => {
              setAppState({ ...appState, mode: "list" });
            }}
          />
        );

      case "detail":
        if (!currentEntity || !appState.id) return <div>Entity or ID not found</div>;
        return (
          <EntityDetailPage
            entity={currentEntity}
            id={appState.id}
            onEdit={() => {
              setAppState({ ...appState, mode: "edit" });
            }}
            onBack={() => {
              setAppState({ ...appState, mode: "list" });
            }}
          />
        );

      case "settings":
        return (
          <SettingsPage
            onBack={() => {
              setAppState({ mode: "dashboard", entity: null, id: null });
            }}
          />
        );

      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <DashboardLayout
      activeEntity={appState.entity}
      onEntityClick={(entityName) => {
        setAppState({ mode: "list", entity: entityName, id: null });
      }}
      onDashboardClick={() => {
        setAppState({ mode: "dashboard", entity: null, id: null });
      }}
      onSettingsClick={() => {
        setAppState({ mode: "settings", entity: null, id: null });
      }}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
