import type { UseFormRegister } from "react-hook-form";
import type { Vendedor } from "@/types/index";

type ConfigBelgranoChecklistForm = {
  sistemaActivoBelgrano: boolean;
  vendedoresDisponibleBelgrano: string[];
};

type CheckListVendedoresBelgranoProps = {
  title: string;
  subtitle: string;
  vendedoresNic: Vendedor[];
  vendedores: string[];
  name: "vendedoresDisponibleBelgrano";
  register: UseFormRegister<ConfigBelgranoChecklistForm>;
};

export default function CheckListVendedoresBelgrano({
  title,
  subtitle,
  vendedoresNic,
  vendedores,
  name,
  register,
}: CheckListVendedoresBelgranoProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
      </div>

      <div className="max-h-56 overflow-y-auto p-2">
        {vendedoresNic.map((v) => {
          const codigo = String(v.codigo);

          return (
            <label key={codigo} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted">
              <div className="flex min-w-0 items-center gap-3">
                <input
                  type="checkbox"
                  value={codigo}
                  defaultChecked={(vendedores ?? []).map(String).includes(codigo)}
                  {...register(name)}
                  className="h-4 w-4 rounded border-input text-foreground focus:ring-ring"
                />
                <span className="truncate text-sm text-foreground">{v.vendedor}</span>
              </div>

              <span className="text-primary font-semibold text-muted-foreground">{v.codigo}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
