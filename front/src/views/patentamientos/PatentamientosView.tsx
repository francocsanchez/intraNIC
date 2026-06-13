import { importPatentamientosFile, type PatentamientosImportType } from "@/services/patentamientosService";
import { paths } from "@/routes/paths";
import { FileSpreadsheet, LoaderCircle, UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type ImportOption = {
  key: PatentamientosImportType;
  title: string;
  description: string;
};

const IMPORT_OPTIONS: ImportOption[] = [
  {
    key: "pais-marcas",
    title: "Importar PAIS - Marcas",
    description: "Archivo de marcas a nivel pais con meses y total.",
  },
  {
    key: "zona-nic-marcas",
    title: "Importar Zona NIC - Marcas",
    description: "Archivo de marcas para la zona NIC con meses y total.",
  },
  {
    key: "pais-modelos",
    title: "Importar PAIS - Modelos",
    description: "Archivo de modelos a nivel pais con marca + modelo en una sola celda.",
  },
  {
    key: "zona-nic-modelos",
    title: "Importar Zona NIC - Modelos",
    description: "Archivo de modelos para la zona NIC con meses y total.",
  },
];

const ACCEPTED_EXCEL_TYPES = ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const INITIAL_UPLOAD_STATE: Record<PatentamientosImportType, boolean> = {
  "pais-marcas": false,
  "zona-nic-marcas": false,
  "pais-modelos": false,
  "zona-nic-modelos": false,
};

export default function PatentamientosView() {
  const [uploading, setUploading] = useState<Record<PatentamientosImportType, boolean>>(INITIAL_UPLOAD_STATE);
  const inputRefs = useRef<Partial<Record<PatentamientosImportType, HTMLInputElement | null>>>({});

  const setUploadingState = (key: PatentamientosImportType, value: boolean) => {
    setUploading((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleInputClick = (key: PatentamientosImportType) => {
    inputRefs.current[key]?.click();
  };

  const handleFileSelected = async (
    key: PatentamientosImportType,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setUploadingState(key, true);

    try {
      const response = await importPatentamientosFile(key, selectedFile);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo importar el archivo");
    } finally {
      event.target.value = "";
      setUploadingState(key, false);
    }
  };

  return (
    <div className="w-full space-y-6 px-1 py-1">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Importacion</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">Actualizar Base de Patentamientos</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
          Desde esta pantalla puedes importar de forma individual los archivos Excel de patentamientos sin guardar el
          archivo original en el servidor.
            </p>
          </div>
          <Link
            to={paths.analisis.patentamientos.dashboard}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-100"
          >
            Ver Dashboard Patentamientos
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Carga individual de datasets</h2>
            <p className="mt-1 text-sm text-gray-500">
              Cada importacion se envia por separado y procesa el contenido del Excel directamente en memoria.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <UploadCloud size={18} strokeWidth={1.8} />
            Sin historial de archivos almacenados
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {IMPORT_OPTIONS.map((option) => {
            const isUploading = uploading[option.key];

            return (
              <article key={option.key} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-gray-900 shadow-sm">
                    <FileSpreadsheet size={20} strokeWidth={1.7} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold tracking-tight text-gray-900">{option.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{option.description}</p>
                  </div>
                </div>

                <input
                  ref={(element) => {
                    inputRefs.current[option.key] = element;
                  }}
                  type="file"
                  accept={ACCEPTED_EXCEL_TYPES}
                  className="hidden"
                  onChange={(event) => void handleFileSelected(option.key, event)}
                />

                <button
                  type="button"
                  onClick={() => handleInputClick(option.key)}
                  disabled={isUploading}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUploading ? (
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
            );
          })}
        </div>
      </section>
    </div>
  );
}
