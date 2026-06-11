import { getMisReservasUsados } from "@/api/usados/stockAPI";
import MisReservasViewContent from "@/components/auth/MisReservasViewContent";
import { useQuery } from "@tanstack/react-query";

export default function MisReservasUsadosView() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["mis", "reservas", "usados"],
    queryFn: getMisReservasUsados,
    refetchOnWindowFocus: true,
  });

  return (
    <MisReservasViewContent
      data={data}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      heading="Resumen de reservas usados"
    />
  );
}
