import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import VendedoresMultiSelect from "@/components/configuracion/VendedoresMultiSelect";
import type { Vendedor } from "@/types/index";

type ConfigUsadosChecklistForm = {
  sistemaActivoUsados: boolean;
  vendedoresReservasUsados: string[];
  vendedoresDisponibleUsados: string[];
  vendedoresStockGuardadoUsados: string[];
  vendedoresStockNoReparadoUsados: string[];
  vendedoresStockPendDocuUsados: string[];
};

type CheckListVendedoresProps = {
  title: string;
  subtitle: string;
  vendedoresNic: Vendedor[];
  name:
    | "vendedoresReservasUsados"
    | "vendedoresDisponibleUsados"
    | "vendedoresStockGuardadoUsados"
    | "vendedoresStockNoReparadoUsados"
    | "vendedoresStockPendDocuUsados";
  control: Control<ConfigUsadosChecklistForm>;
};

export default function CheckListVendedoresUsados({
  title,
  subtitle,
  vendedoresNic,
  name,
  control,
}: CheckListVendedoresProps) {
  const { field } = useController({ control, name });

  return (
    <VendedoresMultiSelect
      title={title}
      subtitle={subtitle}
      vendedores={vendedoresNic}
      value={(field.value ?? []).map(String)}
      onChange={field.onChange}
    />
  );
}
