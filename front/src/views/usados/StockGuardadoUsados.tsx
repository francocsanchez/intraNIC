import { getStockGuardadoUsados } from "@/api/usados/stockAPI";
import StockUsadosView from "@/components/usados/StockUsadosView";

export default function StockGuardadoUsados() {
  return (
    <StockUsadosView
      queryKey={["stockGuardado", "usados"]}
      queryFn={getStockGuardadoUsados}
      title="Stock Guardadas Usados"
    />
  );
}
