import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiRequest } from "../lib/api";

interface UseAPIOptions<TData = unknown> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

export function useAPIQuery<TData = unknown>(
  key: string[],
  url: string,
  options?: UseAPIOptions<TData>,
) {
  return useQuery<TData>({
    queryKey: key,
    queryFn: async () => {
      try {
        const data = await apiRequest<TData>({ method: "GET", url });
        options?.onSuccess?.(data);
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        options?.onError?.(err);
        throw err;
      }
    },
  });
}

export function useAPIMutation<TData = unknown, TVariables = unknown>(
  method: "POST" | "PATCH" | "DELETE",
  urlFactory: (variables: TVariables) => string,
  options?: UseAPIOptions<TData> & { invalidateKeys?: string[][] },
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const url = urlFactory(variables);
      const data = await apiRequest<TData>({
        method,
        url,
        data: method !== "DELETE" ? variables : undefined,
      });
      return data;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
      if (options?.invalidateKeys) {
        for (const key of options.invalidateKeys) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
      }
      toast.success("Operation completed successfully");
    },
    onError: (error) => {
      options?.onError?.(error);
      toast.error(error.message);
    },
  });
}
