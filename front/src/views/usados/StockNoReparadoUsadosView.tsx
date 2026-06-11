import { getStockNoReparadoUsados } from "@/api/usados/stockAPI";
import StockUsadosView from "@/components/usados/StockUsadosView";

export default function StockNoReparadoUsadosView() {
  return (
    <StockUsadosView
      queryKey={["stockNoReparado", "usados"]}
      queryFn={getStockNoReparadoUsados}
      title="Stock No Reparado Usados"
    />
  );
}
