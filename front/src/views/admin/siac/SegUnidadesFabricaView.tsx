import Loading from "@/components/Loading";
import { getSegUnidadesFabrica, importSegUnidadesFabrica } from "@/api/segUnidadesFabricaAPI";
import { hasModuleAccess, hasSegUnidadesFabricaImportAccess } from "@/helpers/access";
import { textToColor } from "@/helpers/colores";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LoaderCircle, UploadCloud } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const ACCEPTED_TXT_TYPES = ".txt,text/plain";

function parseLocalDate(value: string | null) {
  if (!value) return null;

  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getLimitePagoStatus(fechaLimiteDePago: string | null) {
  const parsedDate = parseLocalDate(fechaLimiteDePago);
  if (!parsedDate) {
    return {
      label: "-",
      isOverdue: false,
    };
  }

  const today = startOfDay(new Date());
  const target = startOfDay(parsedDate);
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Atrasado ${Math.abs(diffDays)} dias`,
      isOverdue: true,
    };
  }

  if (diffDays === 0) {
    return {
      label: "Vence hoy",
      isOverdue: false,
    };
  }

  return {
    label: `${diffDays} dias`,
    isOverdue: false,
  };
}

export default function SegUnidadesFabricaView() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { user, isLoading: authLoading } = useAuth();

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["seg-unidades-fabrica"],
    queryFn: getSegUnidadesFabrica,
    refetchOnWindowFocus: true,
  });

  const importMutation = useMutation({
    mutationFn: importSegUnidadesFabrica,
    onSuccess: (response) => {
      toast.success(
        `${response.message}. Importadas: ${response.data.importedRows}. Eliminadas con VIN: ${response.data.removedWithVin}. Eliminadas con finanzas: ${response.data.removedWithFinanzas}.`,
      );
      queryClient.invalidateQueries({ queryKey: ["seg-unidades-fabrica"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "No se pudo importar el archivo");
    },
  });

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    try {
      await importMutation.mutateAsync(selectedFile);
    } finally {
      event.target.value = "";
    }
  };

  if (authLoading || isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar las unidades de fabrica</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  const canAccess = hasModuleAccess(user, "segUnidadesFabrica");
  const canImport = hasSegUnidadesFabricaImportAccess(user);
  if (!canAccess) return null;

  const buildModeloVersion = (modelo: string | null, version: string | null) => {
    if (modelo && version) return `${modelo} - ${version}`;
    return modelo || version || "-";
  };

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Seg. unidades fabrica</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Importa el TXT de fabrica y manten sincronizada la base con las unidades NIC activas pendientes.
            </p>
          </div>

          <Link
            to={paths.administracion.home}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
            Volver a Administracion
          </Link>
        </div>
      </section>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TXT_TYPES}
        className="hidden"
        onChange={(event) => void handleFileSelected(event)}
      />

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Unidades activas sin VIN</h2>
            <p className="mt-1 text-sm text-gray-500">Listado persistido segun la ultima importacion valida.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {data.length} registros
            </div>

            {canImport && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={importMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {importMutation.isPending ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    Importar TXT
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {data.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="text-base font-semibold text-gray-900">Todavia no hay unidades cargadas</h3>
            <p className="mt-2 text-sm text-gray-500">Importa un TXT para comenzar a visualizar unidades NIC pendientes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Order number</th>
                  <th className="px-4 py-3 text-left">Operacion</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Modelo - Version</th>
                  <th className="px-4 py-3 text-left">Color</th>
                  <th className="px-4 py-3 text-left">Ubicacion</th>
                  <th className="px-4 py-3 text-left">Fecha limite de pago</th>
                  <th className="px-4 py-3 text-left">Dias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item) => {
                  const limitePagoStatus = getLimitePagoStatus(item.fechaLimiteDePago);

                  return (
                    <tr
                      key={item._id}
                      className={limitePagoStatus.isOverdue ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900">{item.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{item.opera ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{item.cliente || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{buildModeloVersion(item.modelo, item.version)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.color && item.color !== "-" ? (
                          <span
                            className={`inline-block rounded-md border border-slate-200 px-2 py-1 text-xs font-medium ${textToColor(item.color)}`}
                          >
                            {item.color}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.ubicacion ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{item.fechaLimiteDePago ?? "-"}</td>
                      <td className={limitePagoStatus.isOverdue ? "px-4 py-3 font-semibold text-red-700" : "px-4 py-3 text-gray-700"}>
                        {limitePagoStatus.label}
                      </td>
                
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
