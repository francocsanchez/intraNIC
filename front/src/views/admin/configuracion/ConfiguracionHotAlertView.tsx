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

    const frame = window.requestAnimationFrame(() => {
      setEmails(config.emails);
      setActivo(config.activo);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: HotAlertMailConfigPayload) =>
      updateSsiVentasHotAlertConfig(payload),
    onSuccess: (response) => {
      toast.success(response.message || "Configuracion guardada correctamente");
      queryClient.invalidateQueries({
        queryKey: ["ssi-ventas", "hot-alert-config"],
      });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoading) {
    return (
      <div className="font-preset rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground shadow-sm">
        Cargando configuracion de Hot Alert...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-preset rounded-lg border border-destructive/30 bg-card px-3 py-3 text-sm text-destructive shadow-sm">
        {error instanceof Error
          ? error.message
          : "Error al cargar la configuracion de Hot Alert"}
      </div>
    );
  }

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Administracion
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            Hot Alert
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define quien recibe el correo diario de Hot Alert de SSI Ventas a
            las 20:00.
          </p>
        </div>

        <Link
          to={paths.admin.configuracion}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition hover:bg-primary/90"
        >
          Volver
        </Link>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          <div>
            <div className="text-sm font-semibold text-foreground">
              Destinatarios
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Carga manual de emails para el envio consolidado diario.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={activo}
              onChange={(event) => setActivo(event.target.checked)}
            />
            Activo
          </label>
        </div>

        <div className="space-y-3 px-3 py-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEmails((current) => [...current, ""])}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              <Plus size={14} />
              Agregar email
            </button>
          </div>

          <div className="space-y-3">
            {emails.map((email, index) => (
              <div key={`hot-alert-email-${index}`} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setEmails((current) =>
                        current.map((entry, currentIndex) =>
                          currentIndex === index ? nextValue : entry,
                        ),
                      );
                    }}
                    placeholder="destinatario@empresa.com"
                    className="h-9 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEmails((current) =>
                      current.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    )
                  }
                  className="inline-flex h-9 items-center justify-center rounded-md border border-destructive/30 bg-background px-3 text-destructive hover:bg-muted"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted px-3 py-2">
          <div className="text-sm text-muted-foreground">
            Envio diario consolidado a las 20:00 hs
          </div>

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
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {saveMutation.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </section>
    </div>
  );
}
