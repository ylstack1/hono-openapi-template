import { Menu, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import * as React from "react";

import { useManifest } from "../hooks/useManifest";
import { useUI } from "../hooks/useUI";
import { ENTITY_ICONS } from "../lib/constants";
import { cn } from "../lib/utils";
import { Button } from "./shared/Button";

interface SidebarProps {
  activeEntity: string | null;
  onEntityClick: (entityName: string) => void;
  onDashboardClick: () => void;
}

export function Sidebar({ activeEntity, onEntityClick, onDashboardClick }: SidebarProps) {
  const { manifest } = useManifest();
  const { sidebarCollapsed, toggleSidebar } = useUI();

  const getIcon = (entityName: string) => {
    const iconName = ENTITY_ICONS[entityName] ?? ENTITY_ICONS["default"];
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
    return Icon ? <Icon className="h-5 w-5" /> : <LucideIcons.FileText className="h-5 w-5" />;
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!sidebarCollapsed && <h1 className="text-lg font-semibold">Admin</h1>}
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="space-y-1 p-2">
          <button
            onClick={onDashboardClick}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeEntity === null
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <LucideIcons.LayoutDashboard className="h-5 w-5" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          {manifest?.entities?.map((entity) => (
            <button
              key={entity.name}
              onClick={() => {
                onEntityClick(entity.name);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeEntity === entity.name
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {getIcon(entity.name)}
              {!sidebarCollapsed && <span>{entity.name}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className={cn("transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")} />
    </>
  );
}
