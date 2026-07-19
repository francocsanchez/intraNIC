import {
  getAgendaEnvioConfigs,
  updateAgendaEnvioConfig,
  type AgendaEnvioConfigPayload,
} from "@/api/entregasAPI";
import { paths } from "@/routes/paths";
import type { AgendaEnvioConfig } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Mail, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

type DraftItem = {
  emails: string[];
  activo: boolean;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const buildDrafts = (items: AgendaEnvioConfig[]) =>
  items.reduce<Record<string, DraftItem>>((acc, item) => {
    if (!item.sucursal?._id) {
      return acc;
    }

    acc[item.sucursal._id] = {
      emails: item.emails.length ? item.emails : [""],
      activo: item.activo,
    };
    return acc;
  }, {});

const validateDraft = (draft: DraftItem) => {
  const normalized = draft.emails.map(normalizeEmail);

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

export default function ConfiguracionEnvioAgendaView() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, DraftItem>>({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["entregas", "envio-agenda"],
    queryFn: getAgendaEnvioConfigs,
  });

  useEffect(() => {
    if (!data?.data) {
      return;
    }

    setDrafts(buildDrafts(data.data));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: ({
      sucursalId,
      payload,
    }: {
      sucursalId: string;
      payload: AgendaEnvioConfigPayload;
    }) => updateAgendaEnvioConfig(sucursalId, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Configuracion guardada correctamente");
      queryClient.invalidateQueries({ queryKey: ["entregas", "envio-agenda"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const items = data?.data ?? [];

  const setDraft = (sucursalId: string, updater: (current: DraftItem) => DraftItem) => {
    setDrafts((current) => {
      const base = current[sucursalId] ?? { emails: [""], activo: true };
      return {
        ...current,
        [sucursalId]: updater(base),
      };
    });
  };

  if (isLoading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Cargando configuracion de envio de agenda...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
        {error instanceof Error ? error.message : "Error al cargar la configuracion de envio de agenda"}
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administracion</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Envio de agenda</h1>
          <p className="mt-2 text-sm text-gray-500">
            Define por sucursal quien recibe el PDF automatico diario de la agenda de entrega.
          </p>
        </div>

        <Link
          to={paths.admin.configuracion}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-900"
        >
          Volver
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {items.map((item) => {
          const sucursal = item.sucursal;

          if (!sucursal?._id) {
            return null;
          }

          const draft = drafts[sucursal._id] ?? { emails: [""], activo: item.activo };
          const isSaving = saveMutation.isPending && saveMutation.variables?.sucursalId === sucursal._id;

          return (
            <article key={sucursal._id} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Building2 size={16} className="text-gray-500" />
                    <span>{sucursal.nombre}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{sucursal.direccion || "Sin direccion cargada"}</p>
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={draft.activo}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setDraft(sucursal._id, (current) => ({
                        ...current,
                        activo: checked,
                      }));
                    }}
                  />
                  Activo
                </label>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Destinatarios</p>
                    <p className="mt-1 text-sm text-gray-500">Carga manual de emails, sin necesidad de usuarios del sistema.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDraft(sucursal._id, (current) => ({
                        ...current,
                        emails: [...current.emails, ""],
                      }))
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    <Plus size={14} />
                    Agregar email
                  </button>
                </div>

                <div className="space-y-3">
                  {draft.emails.map((email, index) => (
                    <div key={`${sucursal._id}-${index}`} className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setDraft(sucursal._id, (current) => ({
                              ...current,
                              emails: current.emails.map((entry, currentIndex) =>
                                currentIndex === index ? nextValue : entry,
                              ),
                            }));
                          }}
                          placeholder="destinatario@empresa.com"
                          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setDraft(sucursal._id, (current) => ({
                            ...current,
                            emails: current.emails.length > 1
                              ? current.emails.filter((_, currentIndex) => currentIndex !== index)
                              : [""],
                          }))
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
                <div className="text-sm text-gray-500">
                  Estado sucursal: {sucursal.activa ? "Activa" : "Inactiva"}
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    const validationError = validateDraft(draft);

                    if (validationError) {
                      toast.error(validationError);
                      return;
                    }

                    saveMutation.mutate({
                      sucursalId: sucursal._id,
                      payload: {
                        activo: draft.activo,
                        emails: draft.emails.map(normalizeEmail),
                      },
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />
                  {isSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
