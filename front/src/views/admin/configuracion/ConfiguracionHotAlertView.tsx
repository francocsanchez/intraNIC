import {
  getSsiVentasHotAlertConfig,
  updateSsiVentasHotAlertConfig,
  type HotAlertMailConfigPayload,
} from "@/api/ssiVentasAPI";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const validateDraft = (emails: string[]) => {
  const normalized = emails.map(normalizeEmail);

  if (normalized.some((email) => !email)) {
    return "No se permiten emails vacios";
  }

  if (normalized.some((email) => !EMAIL_REGEX.test(email))) {
    return "Uno o mas emails no tienen un formato valido";
  }

  if (new Set(normalized).size !== normalized.length) {
    return "No se permiten emails duplicados";
  }

  return null;
};

export default function ConfiguracionHotAlertView() {
  const queryClient = useQueryClient();
  const [emails, setEmails] = useState<string[]>([]);
  const [activo, setActivo] = useState(true);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ssi-ventas", "hot-alert-config"],
    queryFn: getSsiVentasHotAlertConfig,
  });

  useEffect(() => {
    const config = data?.data;
    if (!config) {
      return;
    }

    setEmails(config.emails);
    setActivo(config.activo);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: HotAlertMailConfigPayload) => updateSsiVentasHotAlertConfig(payload),
    onSuccess: (response) => {
      toast.success(response.message || "Configuracion guardada correctamente");
      queryClient.invalidateQueries({ queryKey: ["ssi-ventas", "hot-alert-config"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Cargando configuracion de Hot Alert...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
        {error instanceof Error ? error.message : "Error al cargar la configuracion de Hot Alert"}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administracion</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Hot Alert</h1>
          <p className="mt-2 text-sm text-gray-500">
            Define quien recibe el correo diario de Hot Alert de SSI Ventas a las 20:00.
          </p>
        </div>

        <Link
          to={paths.admin.configuracion}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-900"
        >
          Volver
        </Link>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">Destinatarios</div>
            <p className="mt-1 text-sm text-gray-500">Carga manual de emails para el envio consolidado diario.</p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={activo}
              onChange={(event) => setActivo(event.target.checked)}
            />
            Activo
          </label>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEmails((current) => [...current, ""])}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
            >
              <Plus size={14} />
              Agregar email
            </button>
          </div>

          <div className="space-y-3">
            {emails.map((email, index) => (
              <div key={`hot-alert-email-${index}`} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setEmails((current) =>
                        current.map((entry, currentIndex) => (currentIndex === index ? nextValue : entry)),
                      );
                    }}
                    placeholder="destinatario@empresa.com"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEmails((current) =>
                      current.filter((_, currentIndex) => currentIndex !== index),
                    )
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-4">
          <div className="text-sm text-gray-500">Envio diario consolidado a las 20:00 hs</div>

          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => {
              const validationError = validateDraft(emails);

              if (validationError) {
                toast.error(validationError);
                return;
              }

              saveMutation.mutate({
                activo,
                emails: emails.map(normalizeEmail),
              });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {saveMutation.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </section>
    </div>
  );
}
