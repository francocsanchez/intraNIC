import {
  importSsiVentasCsv,
  getSsiVentasAdministrativas,
  getSsiVentasDetail,
  getSsiVentasList,
  registerSsiVentasNoAnswer,
  registerSsiVentasSurvey,
  updateSsiVentasAdministrativa,
  type SsiVentasAdministrativaPayload,
  type SsiVentasNoAnswerPayload,
  type SsiVentasSurveyPayload,
} from "@/api/ssiVentasAPI";
import { hasSsiAdministrativaAccess, hasSsiImportAccess, hasSsiSurveyAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type {
  SsiVentasAdministrativa,
  SsiVentasBinaryAnswers,
  SsiVentasBinaryResponse,
  SsiVentasImportResponse,
  SsiVentasListItem,
  SsiVentasNumericAnswers,
} from "@/types/index";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  Transition,
} from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { BadgeCheck, Check, ChevronDown, CircleDot, Pencil, PhoneCall, PhoneMissed, PhoneOff, PhoneOutgoing, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 30;
const getDefaultDeliveryDate = () => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const numericQuestions: Array<{ key: keyof SsiVentasNumericAnswers; label: string }> = [
  { key: "instalacionesConcesionario", label: "Instalaciones del concesionario" },
  { key: "atencionVendedor", label: "Atencion del vendedor/a" },
  { key: "atencionAdministrativa", label: "Atencion administrativa" },
  { key: "informacionFechaEntrega", label: "Informacion sobre la fecha de entrega" },
  { key: "atencionAsesorEntregas", label: "Atencion del asesor/a de entregas" },
  { key: "recomendariaConcesionario", label: "Probabilidad de recomendar el concesionario" },
];

const binaryQuestions: Array<{ key: keyof SsiVentasBinaryAnswers; label: string }> = [
  { key: "usadoPartePago", label: "Usado como parte de pago" },
  { key: "financiacionCompra", label: "Financiacion de la compra" },
  { key: "seguroVehiculo", label: "Seguro para el vehiculo" },
  { key: "accesoriosVehiculo", label: "Accesorios para el vehiculo" },
  { key: "aplicacionToyota", label: "Aplicacion Toyota" },
  { key: "toyotaServiciosConectados", label: "Toyota Servicios Conectados" },
];

const binaryOptions: Array<{ value: SsiVentasBinaryResponse; label: string }> = [
  { value: "si", label: "Si" },
  { value: "no", label: "No" },
  { value: "noSabe", label: "No sabe" },
];

const createEmptyNumericAnswers = (): SsiVentasNumericAnswers => ({
  instalacionesConcesionario: 10,
  atencionVendedor: 10,
  atencionAdministrativa: 10,
  informacionFechaEntrega: 10,
  atencionAsesorEntregas: 10,
  recomendariaConcesionario: 10,
});

const createEmptyBinaryAnswers = (): SsiVentasBinaryAnswers => ({
  usadoPartePago: "noSabe",
  financiacionCompra: "noSabe",
  seguroVehiculo: "noSabe",
  accesoriosVehiculo: "noSabe",
  aplicacionToyota: "noSabe",
  toyotaServiciosConectados: "noSabe",
});

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const calendarMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (calendarMatch) {
    const [, year, month, day] = calendarMatch;
    return `${Number(day)}/${Number(month)}/${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-AR");
};

const getStatusPillClass = (status: SsiVentasListItem["status"]) => {
  return status === "pendiente" ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground";
};

const getStatusLabel = (status: SsiVentasListItem["status"]) => {
  switch (status) {
    case "encuestada":
      return "Encuestada";
    case "imposibleComunicarse":
      return "Imposible comunicarse";
    case "enGestion":
      return "En gestion";
    default:
      return "Pendiente";
  }
};

const getIdentificadorClienteLabel = (value: SsiVentasListItem["identificadorCliente"] | null | undefined) => {
  switch (value) {
    case "promotor":
      return "Promotor";
    case "neutro":
      return "Neutro";
    case "detractor":
      return "Detractor";
    default:
      return null;
  }
};

const getIdentificadorClienteClass = (value: SsiVentasListItem["identificadorCliente"] | null | undefined) => {
  return value ? "border-border bg-secondary text-secondary-foreground" : "border-border bg-muted text-muted-foreground";
};

function StatusIcon({ status }: { status: SsiVentasListItem["status"] }) {
  if (status === "encuestada") {
    return <BadgeCheck size={15} className="text-foreground" />;
  }

  if (status === "imposibleComunicarse") {
    return <PhoneOff size={15} className="text-muted-foreground" />;
  }

  if (status === "enGestion") {
    return <PhoneOutgoing size={15} className="text-foreground" />;
  }

  return <CircleDot size={15} className="text-muted-foreground" />;
}

function AdministrativaPickerDialog({
  open,
  currentAdministrativa,
  isPending,
  onClose,
  onSave,
  options,
}: {
  open: boolean;
  currentAdministrativa: SsiVentasAdministrativa | null;
  isPending: boolean;
  onClose: () => void;
  onSave: (administrativaId: string) => void;
  options: SsiVentasAdministrativa[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SsiVentasAdministrativa | null>(currentAdministrativa);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSelected(open ? currentAdministrativa : null);
      setQuery("");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentAdministrativa, open]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return options;
    }

    return options.filter((option) => option.nombre.toLowerCase().includes(normalized));
  }, [options, query]);

  const submit = () => {
    if (!selected?._id) {
      toast.error("Selecciona una ADM antes de guardar");
      return;
    }

    onSave(selected._id);
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={() => (isPending ? undefined : onClose())}>
        <Transition.Child
          as="div"
          className="fixed inset-0 bg-foreground/40"
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        />

        <div className="fixed inset-0 flex items-center justify-center p-2">
          <Transition.Child
            as="div"
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="font-preset w-full max-w-xl rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <div>
                  <Dialog.Title className="text-base font-semibold text-popover-foreground">Asignar ADM</Dialog.Title>
                  <p className="mt-0.5 text-sm text-muted-foreground">Busca por nombre y selecciona la administrativa correspondiente.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 px-3 py-3">
                <Combobox value={selected} onChange={setSelected} disabled={isPending} immediate>
                  <div className="relative">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" />
                    <ComboboxInput
                      aria-label="Buscar administrativa"
                      displayValue={(item: SsiVentasAdministrativa | null) => item?.nombre ?? query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar administrativa"
                      className="h-9 w-full rounded-md border border-input bg-background px-10 pr-10 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted"
                    />
                    <ComboboxButton className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                      <ChevronDown size={16} />
                    </ComboboxButton>

                    <ComboboxOptions
                      transition
                      className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg transition duration-150 ease-out empty:invisible data-[closed]:scale-95 data-[closed]:opacity-0"
                    >
                      {filteredOptions.length ? (
                        filteredOptions.map((option) => (
                          <ComboboxOption key={option._id} value={option}>
                            {({ focus, selected: isSelected }) => (
                              <div
                                className={[
                                  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground",
                                  focus ? "bg-secondary" : "bg-popover",
                                ].join(" ")}
                              >
                                <div
                                  className={[
                                    "flex h-5 w-5 items-center justify-center rounded border text-primary-foreground transition",
                                    isSelected ? "border-primary bg-primary" : "border-input bg-background",
                                  ].join(" ")}
                                >
                                  {isSelected ? <Check size={12} /> : null}
                                </div>
                                <div className="font-medium text-popover-foreground">{option.nombre}</div>
                              </div>
                            )}
                          </ComboboxOption>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm text-muted-foreground">No hay usuarios que coincidan con la busqueda.</div>
                      )}
                    </ComboboxOptions>
                  </div>
                </Combobox>

                <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                  Seleccion actual: <span className="font-medium">{selected?.nombre || "Sin ADM asignada"}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border px-3 py-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="inline-flex h-9 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={isPending || !selected?._id || selected._id === currentAdministrativa?._id}
                  className="inline-flex h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Guardar ADM
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

function SsiVentasAdministrativaDialog({
  open,
  operacion,
  onClose,
}: {
  open: boolean;
  operacion: number | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: administrativasResponse } = useQuery({
    queryKey: ["ssi-ventas", "administrativas"],
    queryFn: getSsiVentasAdministrativas,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: detailResponse } = useQuery({
    queryKey: ["ssi-ventas", "detail", operacion],
    queryFn: () => getSsiVentasDetail(operacion!),
    enabled: open && operacion !== null,
  });

  const administrativaMutation = useMutation({
    mutationFn: (payload: SsiVentasAdministrativaPayload) => updateSsiVentasAdministrativa(operacion!, payload),
    onSuccess: async (response) => {
      toast.success(response.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ssi-ventas", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["ssi-ventas", "detail", operacion] }),
      ]);
      onClose();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const administrativas = useMemo(() => administrativasResponse?.data ?? [], [administrativasResponse?.data]);
  const detail = detailResponse?.data;
  const currentAdministrativaId = detail?.case.administrativaId ?? "";
  const selectedAdministrativa =
    administrativas.find((item) => item._id === currentAdministrativaId) ??
    (currentAdministrativaId
      ? {
          _id: currentAdministrativaId,
          nombre: detail?.case.administrativaNombre || "ADM actual",
        }
      : null);

  return (
    <AdministrativaPickerDialog
      open={open}
      currentAdministrativa={selectedAdministrativa}
      isPending={administrativaMutation.isPending}
      onClose={onClose}
      onSave={(administrativaId) => administrativaMutation.mutate({ administrativaId })}
      options={administrativas}
    />
  );
}

function SsiVentasDialog({
  open,
  operacion,
  canSurvey,
  canEditAdministrativa,
  onClose,
}: {
  open: boolean;
  operacion: number | null;
  canSurvey: boolean;
  canEditAdministrativa: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [numericAnswers, setNumericAnswers] = useState<SsiVentasNumericAnswers>(createEmptyNumericAnswers);
  const [binaryAnswers, setBinaryAnswers] = useState<SsiVentasBinaryAnswers>(createEmptyBinaryAnswers);
  const [surveyObservaciones, setSurveyObservaciones] = useState("");
  const [noAnswerObservaciones, setNoAnswerObservaciones] = useState("");
  const [hotAlert, setHotAlert] = useState(false);
  const [administrativaId, setAdministrativaId] = useState("");
  const [isAdministrativaDialogOpen, setIsAdministrativaDialogOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ssi-ventas", "detail", operacion],
    queryFn: () => getSsiVentasDetail(operacion!),
    enabled: open && operacion !== null,
  });
  const { data: administrativasResponse } = useQuery({
    queryKey: ["ssi-ventas", "administrativas"],
    queryFn: getSsiVentasAdministrativas,
    enabled: open && canEditAdministrativa,
  });

  const detail = data?.data;
  const administrativas = useMemo(() => administrativasResponse?.data ?? [], [administrativasResponse?.data]);
  const latestSurveyAttempt = useMemo(
    () => detail?.attempts.find((attempt) => attempt.result === "respondio" && attempt.surveyData) ?? null,
    [detail],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!open) {
        setNumericAnswers(createEmptyNumericAnswers());
        setBinaryAnswers(createEmptyBinaryAnswers());
        setSurveyObservaciones("");
        setNoAnswerObservaciones("");
        setHotAlert(false);
        setAdministrativaId("");
        setIsAdministrativaDialogOpen(false);
        return;
      }

      if (latestSurveyAttempt?.surveyData) {
        setNumericAnswers(latestSurveyAttempt.surveyData.numeric);
        setBinaryAnswers(latestSurveyAttempt.surveyData.binary);
        setSurveyObservaciones(latestSurveyAttempt.surveyData.observaciones ?? "");
        setHotAlert(Boolean(latestSurveyAttempt.surveyData.hotAlert));
      } else {
        setNumericAnswers(createEmptyNumericAnswers());
        setBinaryAnswers(createEmptyBinaryAnswers());
        setSurveyObservaciones("");
        setHotAlert(Boolean(detail?.case.hotAlert));
      }

      setNoAnswerObservaciones("");
      setAdministrativaId(detail?.case.administrativaId ?? "");
      setIsAdministrativaDialogOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [detail?.case.administrativaId, detail?.case.hotAlert, latestSurveyAttempt, open]);

  const surveyMutation = useMutation({
    mutationFn: (payload: SsiVentasSurveyPayload) => registerSsiVentasSurvey(operacion!, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["ssi-ventas"] });
      onClose();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const noAnswerMutation = useMutation({
    mutationFn: (payload: SsiVentasNoAnswerPayload) => registerSsiVentasNoAnswer(operacion!, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["ssi-ventas"] });
      onClose();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const administrativaMutation = useMutation({
    mutationFn: (payload: SsiVentasAdministrativaPayload) => updateSsiVentasAdministrativa(operacion!, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["ssi-ventas"] });
      queryClient.invalidateQueries({ queryKey: ["ssi-ventas", "detail", operacion] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const isPending = surveyMutation.isPending || noAnswerMutation.isPending || administrativaMutation.isPending;
  const canManage = detail?.case.status !== "encuestada" && detail?.case.status !== "imposibleComunicarse";
  const canRespondSurvey = Boolean(canSurvey && canManage);
  const canUpdateAdministrativa = Boolean(canEditAdministrativa && detail);

  const submitSurvey = () => {
    surveyMutation.mutate({
      numeric: numericAnswers,
      binary: binaryAnswers,
      hotAlert,
      observaciones: surveyObservaciones.trim(),
      administrativaId: canUpdateAdministrativa ? administrativaId || undefined : undefined,
    });
  };

  const submitNoAnswer = () => {
    noAnswerMutation.mutate({
      observaciones: noAnswerObservaciones.trim(),
      administrativaId: canUpdateAdministrativa ? administrativaId || undefined : undefined,
    });
  };

  const submitAdministrativa = (nextAdministrativaId: string) => {
    administrativaMutation.mutate({
      administrativaId: nextAdministrativaId,
    }, {
      onSuccess: () => {
        setAdministrativaId(nextAdministrativaId);
        setIsAdministrativaDialogOpen(false);
      },
    });
  };

  const selectedAdministrativa = useMemo(
    () => administrativas.find((item) => item._id === administrativaId) ?? null,
    [administrativaId, administrativas],
  );

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (isPending ? undefined : onClose())}>
          <Transition.Child
            as="div"
            className="fixed inset-0 bg-foreground/40"
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-2">
              <Transition.Child
                as="div"
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="font-preset w-full max-w-6xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Calidad</p>
                    <Dialog.Title className="mt-0.5 text-lg font-semibold tracking-tight text-popover-foreground">
                      Gestion SSI Ventas
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                {isLoading ? (
                  <div className="p-3 text-sm text-muted-foreground">Cargando detalle del caso...</div>
                ) : isError ? (
                  <div className="p-3 text-sm text-destructive">
                    {error instanceof Error ? error.message : "No se pudo cargar el detalle SSI"}
                  </div>
                ) : detail ? (
                  <div className="max-h-[85vh] overflow-y-auto">
                    <section className="grid grid-cols-1 border-b border-border lg:grid-cols-4">
                      <article className="border-b border-r border-border px-3 py-2 lg:border-b-0">
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Operacion</div>
                        <div className="mt-1 text-lg font-semibold text-popover-foreground">{detail.snapshot.operacion}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground">Entrega: {formatDate(detail.snapshot.fechaEntrega)}</div>
                      </article>
                      <article className="border-b border-r border-border px-3 py-2 lg:border-b-0">
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Cliente</div>
                        <div className="mt-1 text-sm font-semibold text-popover-foreground">{detail.snapshot.cliente || "-"}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground">Tel: {detail.snapshot.telefonoCliente || "-"}</div>
                      </article>
                      <article className="border-b border-r border-border px-3 py-2 lg:border-b-0">
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Vendedor</div>
                        <div className="mt-1 text-sm font-semibold text-popover-foreground">{detail.snapshot.vendedor || "-"}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground">Cod: {detail.snapshot.vendedorCodigo ?? "-"}</div>
                      </article>
                      <article className="px-3 py-2">
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Estado</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${getStatusPillClass(detail.case.status)}`}>
                            {getStatusLabel(detail.case.status)}
                          </span>
                          {detail.case.identificadorCliente ? (
                            <span
                              className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${getIdentificadorClienteClass(detail.case.identificadorCliente)}`}
                            >
                              {getIdentificadorClienteLabel(detail.case.identificadorCliente)}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          Intentos: {detail.case.attemptsCount} | No atendio: {detail.case.noAnswerCount}/3
                        </div>
                      </article>
                    </section>

                    <section className="border-b border-border px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-foreground">ADM</div>
                          <div className="mt-0.5 text-sm text-muted-foreground">
                            {selectedAdministrativa?.nombre || detail.case.administrativaNombre || "Sin ADM asignada"}
                          </div>
                        </div>
                        {canUpdateAdministrativa ? (
                          <button
                            type="button"
                            onClick={() => setIsAdministrativaDialogOpen(true)}
                            disabled={isPending}
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={15} />
                            {selectedAdministrativa || detail.case.administrativaNombre ? "Editar ADM" : "Asignar ADM"}
                          </button>
                        ) : null}
                      </div>
                    </section>

                    <div className="grid grid-cols-1 gap-3 px-3 py-3 lg:grid-cols-[1.4fr_0.9fr]">
                      <section className="space-y-3">
                        <div className="border border-border">
                          <div className="border-b border-border px-3 py-2">
                            <h2 className="text-sm font-semibold text-popover-foreground">Encuesta Convencional</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              Completa la encuesta si el cliente atendio. Si el caso ya esta cerrado o tu rol no permite responder, se muestra en solo lectura.
                            </p>
                          </div>

                          <div className="space-y-3 p-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              {numericQuestions.map((question) => (
                                <label key={question.key} className="space-y-1 text-sm font-medium text-foreground">
                                  <span>{question.label}</span>
                                  <select
                                    value={numericAnswers[question.key]}
                                    disabled={!canRespondSurvey || isPending}
                                    onChange={(event) =>
                                      setNumericAnswers((current) => ({
                                        ...current,
                                        [question.key]: Number(event.target.value),
                                      }))
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:bg-muted"
                                  >
                                    {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                                      <option key={value} value={value}>
                                        {value}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ))}
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              {binaryQuestions.map((question) => (
                                <label key={question.key} className="space-y-1 text-sm font-medium text-foreground">
                                  <span>{question.label}</span>
                                  <select
                                    value={binaryAnswers[question.key]}
                                    disabled={!canRespondSurvey || isPending}
                                    onChange={(event) =>
                                      setBinaryAnswers((current) => ({
                                        ...current,
                                        [question.key]: event.target.value as SsiVentasBinaryResponse,
                                      }))
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:bg-muted"
                                  >
                                    {binaryOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ))}
                            </div>

                            <label className="space-y-1 text-sm font-medium text-foreground">
                              <span>Observaciones</span>
                              <textarea
                                rows={4}
                                value={surveyObservaciones}
                                disabled={!canRespondSurvey || isPending}
                                onChange={(event) => setSurveyObservaciones(event.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:bg-muted"
                                placeholder="Comentario del cliente u observaciones del llamado"
                              />
                            </label>

                            <label className="flex items-center gap-3 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
                              <input
                                type="checkbox"
                                checked={hotAlert}
                                disabled={!canRespondSurvey || isPending}
                                onChange={(event) => setHotAlert(event.target.checked)}
                                className="h-4 w-4 rounded border-input text-primary focus:ring-ring disabled:cursor-not-allowed"
                              />
                              <span>Hot Alert</span>
                            </label>

                            {canRespondSurvey ? (
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={submitSurvey}
                                  disabled={isPending}
                                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <BadgeCheck size={16} />
                                  Guardar encuesta
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </section>

                      <section className="space-y-3">
                        <div className="border border-border">
                          <div className="border-b border-border px-3 py-2">
                            <h2 className="text-sm font-semibold text-popover-foreground">Intento no atendido</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              Cada marca de no atendio suma un intento. Al tercer intento fallido el caso se cierra automaticamente.
                            </p>
                          </div>

                          <div className="space-y-3 p-3">
                            <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                              Acumulado actual: <span className="font-semibold">{detail.case.noAnswerCount}/3</span>
                            </div>

                            <label className="space-y-1 text-sm font-medium text-foreground">
                              <span>Observaciones del intento</span>
                              <textarea
                                rows={4}
                                value={noAnswerObservaciones}
                                disabled={!canRespondSurvey || isPending}
                                onChange={(event) => setNoAnswerObservaciones(event.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:bg-muted"
                                placeholder="Ej: se llamo y no atendio"
                              />
                            </label>

                            {canRespondSurvey ? (
                              <button
                                type="button"
                                onClick={submitNoAnswer}
                                disabled={isPending}
                                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-secondary px-3 text-sm font-semibold text-secondary-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <PhoneMissed size={16} />
                                Marcar no atendio
                              </button>
                            ) : (
                              <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                                {canManage ? "Tu rol no tiene permiso para registrar la encuesta o marcar no atendio." : "El caso ya esta cerrado. Solo se muestra el historial."}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border border-border">
                          <div className="border-b border-border px-3 py-2">
                            <h2 className="text-sm font-semibold text-popover-foreground">Historial de intentos</h2>
                          </div>

                          <div className="space-y-2 p-3">
                            {detail.attempts.length ? (
                              detail.attempts.map((attempt) => (
                                <article key={attempt._id} className="rounded-md border border-border bg-muted px-3 py-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      {attempt.result === "respondio" ? (
                                        <PhoneOutgoing size={16} className="text-foreground" />
                                      ) : detail.case.status === "imposibleComunicarse" && attempt.attemptNumber === detail.case.attemptsCount ? (
                                        <PhoneOff size={16} className="text-muted-foreground" />
                                      ) : (
                                        <PhoneMissed size={16} className="text-muted-foreground" />
                                      )}
                                      <span className="text-sm font-semibold text-popover-foreground">
                                        Intento {attempt.attemptNumber} - {attempt.result === "respondio" ? "Respondio" : "No atendio"}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatDateTime(attempt.createdAt)}</span>
                                  </div>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Usuario: <span className="font-medium text-popover-foreground">{attempt.createdByName || "-"}</span>
                                  </p>
                                  {attempt.identificadorCliente ? (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      Cliente:{" "}
                                      <span
                                        className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${getIdentificadorClienteClass(attempt.identificadorCliente)}`}
                                      >
                                        {getIdentificadorClienteLabel(attempt.identificadorCliente)}
                                      </span>
                                    </p>
                                  ) : null}
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Observaciones: <span className="font-medium text-popover-foreground">{attempt.observaciones?.trim() || "-"}</span>
                                  </p>
                                  {attempt.surveyData?.hotAlert ? (
                                    <p className="mt-1 text-sm text-secondary-foreground">
                                      Hot Alert: <span className="font-semibold">Si</span>
                                    </p>
                                  ) : null}
                                </article>
                              ))
                            ) : (
                              <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                                Todavia no hay intentos registrados para esta operacion.
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                ) : null}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
      </Dialog>

      <AdministrativaPickerDialog
        open={isAdministrativaDialogOpen}
        currentAdministrativa={selectedAdministrativa}
        isPending={isPending}
        onClose={() => setIsAdministrativaDialogOpen(false)}
        onSave={submitAdministrativa}
        options={administrativas}
      />
    </Transition>
  );
}

export default function SsiVentasView() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [page, setPage] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState(getDefaultDeliveryDate);
  const [selectedOperacion, setSelectedOperacion] = useState<number | null>(null);
  const [selectedAdministrativaOperacion, setSelectedAdministrativaOperacion] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"pendientes" | "enGestion" | "imposibleComunicarse" | "encuestadas">("pendientes");
  const [importResult, setImportResult] = useState<SsiVentasImportResponse | null>(null);
  const canSurvey = hasSsiSurveyAccess(user);
  const canImport = hasSsiImportAccess(user);
  const canEditAdministrativa = hasSsiAdministrativaAccess(user);

  const importMutation = useMutation({
    mutationFn: (file: File) => importSsiVentasCsv(file),
    onSuccess: async (response) => {
      setImportResult(response);
      toast.success(response.message);
      await queryClient.invalidateQueries({ queryKey: ["ssi-ventas"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ssi-ventas", "list", page, deliveryDate],
    queryFn: () => getSsiVentasList({ page, limit: PAGE_SIZE, deliveryDate }),
  });

  const items = useMemo(() => data?.data ?? [], [data?.data]);
  const pendingItems = useMemo(() => items.filter((item) => item.status === "pendiente"), [items]);
  const inProgressItems = useMemo(() => items.filter((item) => item.status === "enGestion"), [items]);
  const unreachableItems = useMemo(() => items.filter((item) => item.status === "imposibleComunicarse"), [items]);
  const surveyedItems = useMemo(() => items.filter((item) => item.status === "encuestada"), [items]);
  const visibleItems = useMemo(() => {
    if (activeTab === "enGestion") return inProgressItems;
    if (activeTab === "imposibleComunicarse") return unreachableItems;
    if (activeTab === "encuestadas") return surveyedItems;
    return pendingItems;
  }, [activeTab, inProgressItems, pendingItems, surveyedItems, unreachableItems]);
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const importSummary = importResult?.data.summary;
  const importIssues = useMemo(
    () => (importResult?.data.results ?? []).filter((item) => item.status !== "importada").slice(0, 8),
    [importResult],
  );

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    importMutation.mutate(file);
    event.target.value = "";
  };

  if (isLoading) {
    return (
      <div className="font-preset rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
        Cargando SSI Ventas...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-preset rounded-lg border border-destructive/30 bg-card p-3 text-destructive shadow-sm">
        {error instanceof Error ? error.message : "No se pudo cargar SSI Ventas"}
      </div>
    );
  }

  return (
    <div className="font-preset space-y-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Calidad</p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-card-foreground">SSI Ventas Convencional</h1>
          </div>
          <div className="flex flex-col gap-2 p-3 pt-0 sm:flex-row sm:items-center lg:pt-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span>Fecha</span>
              <input
                type="date"
                value={deliveryDate}
                onChange={(event) => {
                  setDeliveryDate(event.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
              />
            </label>

            {canImport ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importMutation.isPending}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload size={15} />
                  {importMutation.isPending ? "Importando..." : "Importar CSV"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {importSummary ? (
        <section className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-card-foreground">Ultimo import</p>
              <p className="truncate text-xs text-muted-foreground">{importResult?.message}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                Leidas {importSummary.totalRead}
              </span>
              <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                Importadas {importSummary.imported}
              </span>
              <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                No respondidas {importSummary.ignoredNoRespondida}
              </span>
              <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                No encontradas {importSummary.notFound}
              </span>
              <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                Conflictos {importSummary.conflicts}
              </span>
              <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                Errores {importSummary.validationErrors}
              </span>
            </div>
          </div>

          {importIssues.length ? (
            <details className="mt-2 rounded-md border border-border bg-muted">
              <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-foreground">
                Ver observaciones ({importIssues.length})
              </summary>
              <div className="space-y-2 border-t border-border px-3 py-2">
                {importIssues.map((item) => (
                  <div key={`${item.rowNumber}-${item.operacion ?? "sin-operacion"}`} className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">
                      Fila {item.rowNumber}
                      {item.operacion ? ` | Op. ${item.operacion}` : ""}
                      {item.contactoNombre ? ` | ${item.contactoNombre}` : ""}
                    </div>
                    <div className="mt-1">{item.message}</div>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border px-3 py-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("pendientes")}
              className={[
                "h-9 rounded-md px-3 text-sm font-semibold transition-colors",
                activeTab === "pendientes"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              Pendientes ({pendingItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("enGestion")}
              className={[
                "h-9 rounded-md px-3 text-sm font-semibold transition-colors",
                activeTab === "enGestion"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              En gestion ({inProgressItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("imposibleComunicarse")}
              className={[
                "h-9 rounded-md px-3 text-sm font-semibold transition-colors",
                activeTab === "imposibleComunicarse"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              Imposible ({unreachableItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("encuestadas")}
              className={[
                "h-9 rounded-md px-3 text-sm font-semibold transition-colors",
                activeTab === "encuestadas"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              Encuestadas ({surveyedItems.length})
            </button>
          </div>

          <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
            {visibleItems.length} visibles
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full text-sm">
            <thead className="bg-muted text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Accion</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Intentos</th>
                <th className="px-3 py-2 text-left">Operacion</th>
                <th className="px-3 py-2 text-left">F. Entrega</th>
                <th className="px-3 py-2 text-left">ADM</th>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-left">Telefono</th>
                <th className="px-3 py-2 text-left">Vendedor</th>
                <th className="px-3 py-2 text-left">Modelo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleItems.map((item) => (
                <tr
                  key={item.operacion}
                  className={[
                    "transition-colors",
                    item.hotAlert ? "bg-secondary hover:bg-muted" : "hover:bg-muted",
                  ].join(" ")}
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOperacion(item.operacion)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary/90"
                      title={item.canManage ? "Gestionar llamada" : "Ver detalle del caso"}
                    >
                      <PhoneCall size={15} />
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      title={getStatusLabel(item.status)}
                      className={`inline-flex items-center justify-center rounded-md p-1 ${getStatusPillClass(item.status)}`}
                    >
                      <StatusIcon status={item.status} />
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {item.status === "enGestion" || item.status === "imposibleComunicarse"
                      ? item.attemptProgressLabel
                      : item.attemptsCount}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="font-semibold text-card-foreground">{item.operacion}</span>
                      {item.identificadorCliente ? (
                        <span
                          className={`inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${getIdentificadorClienteClass(item.identificadorCliente)}`}
                        >
                          {getIdentificadorClienteLabel(item.identificadorCliente)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">{formatDate(item.fechaEntrega)}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="max-w-[120px] truncate">{item.administrativaNombre || "-"}</span>
                      {canEditAdministrativa ? (
                        <button
                          type="button"
                          onClick={() => setSelectedAdministrativaOperacion(item.operacion)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                          title={item.administrativaNombre ? "Editar ADM" : "Asignar ADM"}
                        >
                          <Pencil size={13} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-1.5 text-muted-foreground">{item.cliente || "-"}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{item.telefonoCliente || "-"}</td>
                  <td className="max-w-[180px] truncate px-3 py-1.5 text-muted-foreground">{item.vendedor || "-"}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{item.modelo || "-"}</td>
                </tr>
              ))}

              {!visibleItems.length ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No hay registros en esta vista.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-3 py-2 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {pagination?.page ?? 1} de {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1}
              className="inline-flex h-9 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={page >= totalPages}
              className="inline-flex h-9 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      <SsiVentasDialog
        open={selectedOperacion !== null}
        operacion={selectedOperacion}
        canSurvey={canSurvey}
        canEditAdministrativa={canEditAdministrativa}
        onClose={() => setSelectedOperacion(null)}
      />
      {canEditAdministrativa ? (
        <SsiVentasAdministrativaDialog
          open={selectedAdministrativaOperacion !== null}
          operacion={selectedAdministrativaOperacion}
          onClose={() => setSelectedAdministrativaOperacion(null)}
        />
      ) : null}
    </div>
  );
}
