import { importCallCenterFile } from "@/api/callCenterAPI";
import { paths } from "@/routes/paths";
import { FileSpreadsheet, LoaderCircle, UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const ACCEPTED_EXCEL_TYPES =
  ".xls,.xlsx,.htm,.html,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/html";

export default function CallCenterImportView() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setUploading(true);

    try {
      const response = await importCallCenterFile(selectedFile);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo importar el archivo");
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6 px-1 py-1">
      <section className="rounded-3xl border border-[#e5dccd] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7b62]">Call Center</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2f2616]">Importador de datos</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#6d6049]">
              Carga el reporte de oportunidades para actualizar la base de Call Center y sincronizar automaticamente
              los origenes de datos detectados en el archivo.
            </p>
          </div>

          <Link
            to={paths.callCenter.origenesDatos}
            className="inline-flex items-center justify-center rounded-xl border border-[#d8cfbf] bg-white px-4 py-3 text-sm font-semibold text-[#2f2616] transition hover:border-[#bcae93] hover:bg-[#f8f4eb]"
          >
            Gestionar origenes
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e5dccd] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#f0e8da] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#2f2616]">Carga del archivo</h2>
            <p className="mt-1 text-sm text-[#6d6049]">
              El archivo se procesa en memoria. Si el origen de una oportunidad no existe, se crea automaticamente.
            </p>
            <p className="mt-2 inline-flex rounded-full border border-[#e6d3a6] bg-[#fff7e4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6f00]">
              Limite por archivo: 50 MB
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl bg-[#f7f0de] px-4 py-3 text-sm text-[#8a6400]">
            <UploadCloud size={18} strokeWidth={1.8} />
            Upsert por Id. de la oportunidad
          </div>
        </div>

        <article className="mt-6 rounded-3xl border border-[#efe7d8] bg-[#fbf8f2] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2f2616] shadow-sm">
              <FileSpreadsheet size={22} strokeWidth={1.7} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold tracking-tight text-[#2f2616]">Reporte de oportunidades</h3>
              <p className="mt-1 text-sm text-[#6d6049]">
                Soporta archivos `.xls`, `.xlsx` y la hoja HTML exportada con columnas como `Id. de la oportunidad`,
                `Origen de la oportunidad` y fechas de seguimiento.
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXCEL_TYPES}
            className="hidden"
            onChange={(event) => void handleFileSelected(event)}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d8cfbf] bg-white px-4 py-3 text-sm font-semibold text-[#2f2616] transition hover:border-[#bcae93] hover:bg-[#f8f4eb] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {uploading ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Importando archivo...
              </>
            ) : (
              <>
                <UploadCloud size={17} />
                Seleccionar archivo
              </>
            )}
          </button>
        </article>
      </section>
    </div>
  );
}
