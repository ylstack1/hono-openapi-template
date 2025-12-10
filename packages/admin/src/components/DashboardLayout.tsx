import { LogOut, Settings, User } from "lucide-react";
import * as React from "react";

import { useAuth } from "../hooks/useAuth";
import { Button } from "./shared/Button";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeEntity: string | null;
  onEntityClick: (entityName: string) => void;
  onDashboardClick: () => void;
  onSettingsClick: () => void;
}

export function DashboardLayout({
  children,
  activeEntity,
  onEntityClick,
  onDashboardClick,
  onSettingsClick,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeEntity={activeEntity} onEntityClick={onEntityClick} onDashboardClick={onDashboardClick} />

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">{activeEntity ?? "Dashboard"}</h2>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onSettingsClick}>
                <Settings className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user?.name ?? "Admin"}</span>
              </div>

              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
