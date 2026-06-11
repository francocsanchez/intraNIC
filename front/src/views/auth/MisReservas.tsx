import { misReservas } from "@/api/convencional/stockAPI";
import MisReservasViewContent from "@/components/auth/MisReservasViewContent";
import { useQuery } from "@tanstack/react-query";

export default function MisReservas() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["mis", "reservas", "convencional"],
    queryFn: misReservas,
    refetchOnWindowFocus: true,
  });

  return <MisReservasViewContent data={data} isLoading={isLoading} isError={isError} error={error ?? null} heading="Resumen de reservas" />;
}
