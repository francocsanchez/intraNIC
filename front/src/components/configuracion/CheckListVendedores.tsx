import type { UseFormRegister } from "react-hook-form";

type Vendedor = { codigo: number; vendedor: string };

type CheckListVendedoresProps = {
  title: string;
  subtitle: string;
  vendedoresNic: Vendedor[];
  vendedores: string[];
  name:
    | "vendedoresReservasConvencional"
    | "vendedoresDisponibleConvencional"
    | "vendedoresStockGuardadoConvencional";
  register: UseFormRegister<any>;
};

export default function CheckListVendedores({
  title,
  subtitle,
  vendedoresNic,
  vendedores,
  name,
  register,
}: CheckListVendedoresProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {title}
        </div>
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      </div>

      <div className="max-h-56 overflow-y-auto p-2">
        {vendedoresNic.map((v) => {
          const codigo = String(v.codigo);

          return (
            <label
              key={codigo}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  value={codigo}
                  defaultChecked={(vendedores ?? []).map(String).includes(codigo)}
                  {...register(name)}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                />
                <span className="text-sm text-gray-900 truncate">
                  {v.vendedor}
                </span>
              </div>

              <span className="text-[11px] font-semibold text-gray-400">
                {v.codigo}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}