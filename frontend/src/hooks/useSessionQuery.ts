import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "../services/auth.api";

export function useSessionQuery() {
  return useQuery({
    queryKey: ["session"],
    queryFn: fetchMe,
    staleTime: 30_000,
  });
}
