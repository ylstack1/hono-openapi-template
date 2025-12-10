import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UIState } from "../lib/types";

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeEntity: null,
      modalOpen: false,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setActiveEntity: (entity: string | null) => set({ activeEntity: entity }),

      setModalOpen: (open: boolean) => set({ modalOpen: open }),
    }),
    {
      name: "baas-admin-ui",
    },
  ),
);

export const useUI = () => useUIStore();
