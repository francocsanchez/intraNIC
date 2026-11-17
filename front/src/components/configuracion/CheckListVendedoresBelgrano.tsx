import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import VendedoresMultiSelect from "@/components/configuracion/VendedoresMultiSelect";
import type { Vendedor } from "@/types/index";

type ConfigBelgranoChecklistForm = {
  sistemaActivoBelgrano: boolean;
  vendedoresDisponibleBelgrano: string[];
};

type CheckListVendedoresBelgranoProps = {
  title: string;
  subtitle: string;
  vendedoresNic: Vendedor[];
  name: "vendedoresDisponibleBelgrano";
  control: Control<ConfigBelgranoChecklistForm>;
};

export default function CheckListVendedoresBelgrano({
  title,
  subtitle,
  vendedoresNic,
  name,
  control,
}: CheckListVendedoresBelgranoProps) {
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
