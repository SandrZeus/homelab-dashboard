import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Target } from "../types";

const TARGETS_KEY = ["servicepatrol", "targets"];

export function useServicePatrolTargets() {
  return useQuery({
    queryKey: TARGETS_KEY,
    queryFn: api.getTargets,
    staleTime: 10_000,
  });
}

type TargetInput = Omit<Target, "id" | "created_at" | "updated_at">;

export function useCreateTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (target: TargetInput) => api.createTarget(target),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARGETS_KEY });
    },
  });
}

export function useUpdateTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, target }: { id: number; target: TargetInput }) =>
      api.updateTarget(id, target),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARGETS_KEY });
    },
  });
}

export function useDeleteTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteTarget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARGETS_KEY });
    },
  });
}
