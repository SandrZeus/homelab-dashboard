import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useCapabilities() {
  return useQuery({
    queryKey: ["capabilities"],
    queryFn: api.getCapabilities,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
