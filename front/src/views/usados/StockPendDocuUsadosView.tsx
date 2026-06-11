import { getStockPendienteDocumentacionUsados } from "@/api/usados/stockAPI";
import StockUsadosView from "@/components/usados/StockUsadosView";

export default function StockPendDocuUsadosView() {
  return (
    <StockUsadosView
      queryKey={["stockPendienteDocumentacion", "usados"]}
      queryFn={getStockPendienteDocumentacionUsados}
      title="Stock Pendiente Documentacion Usados"
    />
  );
}
