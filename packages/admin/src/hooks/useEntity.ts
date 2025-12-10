import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  EntityFormData,
  PaginatedResponse,
  PaginationParams,
} from "../lib/types";

import { apiRequest } from "../lib/api";

export function useEntityList<T = EntityFormData>(
  entityName: string,
  params: PaginationParams & Record<string, unknown> = {
    page: 1,
    pageSize: 20,
  },
) {
  return useQuery<PaginatedResponse<T>>({
    queryKey: ["entity", entityName, "list", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      return apiRequest<PaginatedResponse<T>>({
        method: "GET",
        url: `/api/${entityName}?${searchParams.toString()}`,
      });
    },
  });
}

export function useEntityDetail<T = EntityFormData>(
  entityName: string,
  id: string | undefined,
) {
  return useQuery<T>({
    queryKey: ["entity", entityName, "detail", id],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      return apiRequest<T>({
        method: "GET",
        url: `/api/${entityName}/${id}`,
      });
    },
    enabled: Boolean(id),
  });
}

export function useEntityCreate<T = EntityFormData>(entityName: string) {
  const queryClient = useQueryClient();

  return useMutation<T, Error, EntityFormData>({
    mutationFn: async (data: EntityFormData) => {
      return apiRequest<T>({
        method: "POST",
        url: `/api/${entityName}`,
        data,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["entity", entityName, "list"],
      });
      toast.success(`${entityName} created successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to create ${entityName}: ${error.message}`);
    },
  });
}

export function useEntityUpdate<T = EntityFormData>(
  entityName: string,
  id: string,
) {
  const queryClient = useQueryClient();

  return useMutation<T, Error, EntityFormData>({
    mutationFn: async (data: EntityFormData) => {
      return apiRequest<T>({
        method: "PATCH",
        url: `/api/${entityName}/${id}`,
        data,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["entity", entityName, "list"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["entity", entityName, "detail", id],
      });
      toast.success(`${entityName} updated successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to update ${entityName}: ${error.message}`);
    },
  });
}

export function useEntityDelete(entityName: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiRequest<void>({
        method: "DELETE",
        url: `/api/${entityName}/${id}`,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["entity", entityName, "list"],
      });
      toast.success(`${entityName} deleted successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to delete ${entityName}: ${error.message}`);
    },
  });
}
