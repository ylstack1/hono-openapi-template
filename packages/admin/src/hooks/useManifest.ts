import type { Manifest } from "@baas-workers/usecore";

import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ManifestState } from "../lib/types";

import { apiRequest } from "../lib/api";

export const useManifestStore = create<ManifestState>()(
  persist(
    (set) => ({
      manifest: null,
      loading: false,
      error: null,

      setManifest: (manifest: Manifest) =>
        set({ manifest, loading: false, error: null }),

      setLoading: (loading: boolean) => set({ loading }),

      setError: (error: string | null) => set({ error, loading: false }),
    }),
    {
      name: "baas-admin-manifest",
    },
  ),
);

export function useManifest() {
  const { manifest, setManifest, setLoading, setError } = useManifestStore();

  const query = useQuery<Manifest>({
    queryKey: ["manifest"],
    queryFn: async () => {
      setLoading(true);
      try {
        const data = await apiRequest<Manifest>({
          method: "GET",
          url: "/api/manifest",
        });
        setManifest(data);
        return data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load manifest";
        setError(message);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !manifest,
  });

  return {
    manifest: manifest ?? query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
