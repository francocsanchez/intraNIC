import { getMe } from "@/api/usuarioAPI";
import { useQuery } from "@tanstack/react-query";

export const useAuth = () => {
  const token = localStorage.getItem("AUTH_TOKEN");

  const query = useQuery({
    queryKey: ["auth-user"],
    queryFn: getMe,
    enabled: !!token,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60 * 5, // cada 5 minutos
  });

  if (query.isError) {
    localStorage.removeItem("AUTH_TOKEN");
  }

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isAuthenticated: !!query.data && !query.isError,
    refetch: query.refetch,
  };
};