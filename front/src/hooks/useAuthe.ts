import { getMe } from "@/api/usuarioAPI";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";

const AUTH_USER_STORAGE_KEY = "AUTH_USER";
const isSessionRejection = (error: unknown) => isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);

const readCachedUser = () => {
  try {
    const value = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
};

export const useAuth = () => {
  const token = localStorage.getItem("AUTH_TOKEN");
  const [cachedUser] = useState(readCachedUser);

  const query = useQuery({
    queryKey: ["auth-user"],
    queryFn: getMe,
    enabled: !!token,
    initialData: cachedUser ?? undefined,
    retry: (_failureCount, error) => !isSessionRejection(error),
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60 * 5, // cada 5 minutos
  });

  const sessionRejected = isSessionRejection(query.error);
  const user = query.data ?? cachedUser;
  const isSessionRecovering = Boolean(token) && !user && !sessionRejected;

  useEffect(() => {
    if (query.data) localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(query.data));
  }, [query.data]);

  useEffect(() => {
    if (!sessionRejected) return;
    localStorage.removeItem("AUTH_TOKEN");
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }, [sessionRejected]);

  return {
    user: user ?? null,
    isLoading: query.isLoading || (isSessionRecovering && query.isFetching),
    isSessionRecovering,
    isError: sessionRejected,
    isAuthenticated: Boolean(token) && !sessionRejected,
    refetch: query.refetch,
  };
};
