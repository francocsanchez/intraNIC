import Loading from "@/components/Loading";
import {
  buildCentralDeudoresViewModel,
  formatCentralDeudoresDate,
  formatCentralDeudoresMoney,
  formatPeriodo,
  getCentralDeudores,
  getSituacionTone,
} from "@/services/centralDeudoresService";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Landmark, Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

const FLAG_LABELS: Array<{ key: string; label: string }> = [
  { key: "refinanciaciones", label: "Refinanciada" },
  { key: "recategorizacionOblig", label: "Recategorizacion" },
  { key: "situacionJuridica", label: "Juridica" },
  { key: "irrecDisposicionTecnica", label: "Disp. tecnica" },
  { key: "enRevision", label: "En revision" },
  { key: "procesoJud", label: "Proceso judicial" },
];

const formatBankGroup = (value: number) => `Banco ${value}`;

export default function CentralDeudoresView() {
  const [inputValue, setInputValue] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["central-deudores", submittedId],
    queryFn: () => getCentralDeudores(submittedId),
    enabled: submittedId.length === 11,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const viewModel = useMemo(
    () => (data ? buildCentralDeudoresViewModel(data) : null),
    [data],
  );

  const effectiveError = inlineError ?? (error instanceof Error ? error.message : null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = inputValue.replace(/\D/g, "");

    if (normalized.length !== 11) {
      setInlineError("Ingresar 11 digitos para realizar la consulta.");
      return;
    }

    setInlineError(null);
    setSubmittedId(normalized);
  };

  const tapeTone = viewModel?.riesgoVisual ?? getSituacionTone(null);

  return (
    <div className="font-preset w-full px-2 py-3">
      <div className="mx-auto max-w-none overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className={`h-1 w-full ${tapeTone.chipClassName}`} />

        <section className="border-b border-border px-3 py-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] xl:items-end">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Analisis crediticio</p>
              <div className="mt-1 flex items-center gap-2">
                <ShieldAlert size={18} className={tapeTone.accentClassName} />
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Central de Deudores</h1>
              </div>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Consulta consolidada de deuda vigente, historial de 24 meses y cheques rechazados por CUIT.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="block">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  CUIT / CUIL / CDI
                </span>
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                  <Landmark size={16} className="text-muted-foreground" />
                  <input
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="Ej. 20123456789"
                    inputMode="numeric"
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </label>

              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center gap-2 self-end rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <Search size={15} />
                {isFetching ? "Consultando" : "Consultar"}
              </button>
            </form>
          </div>

          {effectiveError ? (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle size={16} />
              <span>{effectiveError}</span>
            </div>
          ) : null}
        </section>

        {!submittedId && !viewModel ? (
          <section className="px-3 py-5">
            <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-border bg-muted px-3 text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <ShieldAlert size={20} />
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Consulta lista para usar</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ingresa un CUIT de 11 digitos y el sistema traerá la deuda actual, la evolucion historica y los cheques rechazados.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {isLoading && submittedId ? (
          <div className="px-4 py-6">
            <Loading />
          </div>
        ) : null}

        {viewModel ? (
          <section className="grid gap-3 px-3 py-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.35fr)_minmax(0,1.05fr)]">
            <article className={`rounded-lg border bg-card px-3 py-3 shadow-sm ${viewModel.riesgoVisual.borderClassName}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Titular</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{viewModel.denominacion}</h2>
                  <p className="text-xs text-muted-foreground">{viewModel.identificacion}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${viewModel.riesgoVisual.chipClassName}`}>
                  {viewModel.resumen.peorSituacionLabel}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className={`rounded-md border px-3 py-2 ${viewModel.riesgoVisual.borderClassName} ${viewModel.riesgoVisual.softClassName}`}>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Deuda vigente</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{formatCentralDeudoresMoney(viewModel.resumen.totalDeuda)}</p>
                </div>
                <div className="rounded-md border border-border bg-muted px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Periodo</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{formatPeriodo(viewModel.resumen.periodoActual)}</p>
                </div>
                <div className="rounded-md border border-border bg-muted px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Entidades</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{viewModel.resumen.cantidadEntidades}</p>
                </div>
                <div className="rounded-md border border-border bg-muted px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Cheques</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{viewModel.resumen.cantidadChequesRechazados}</p>
                </div>
              </div>

              {viewModel.erroresParciales.length ? (
                <div className="mt-3 space-y-1 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive">Datos parciales</p>
                  {viewModel.erroresParciales.map((item) => (
                    <p key={item} className="text-xs text-destructive">{item}</p>
                  ))}
                </div>
              ) : null}

              <section className="mt-3 border-t border-border pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Cheques rechazados</p>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">Detalle por causal</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{viewModel.resumen.cantidadChequesRechazados} cheques</span>
                </div>

                {viewModel.chequesRechazados.error ? (
                  <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {viewModel.chequesRechazados.error}
                  </div>
                ) : viewModel.chequesRechazados.causales.length ? (
                  <div className="mt-3 space-y-3">
                    {viewModel.chequesRechazados.causales.map((causal) => (
                      <div key={causal.causal} className="rounded-md border border-border bg-muted px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-foreground">{causal.causal}</h4>
                          <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
                            {causal.cantidadCheques}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          {causal.entidades.map((entidad) => (
                            <div key={`${causal.causal}-${entidad.entidad}`} className="rounded-md border border-border bg-card px-3 py-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                {formatBankGroup(entidad.entidad)}
                              </p>
                              <div className="mt-2 space-y-2">
                                {entidad.detalle.map((detalle) => (
                                  <div key={`${detalle.nroCheque}-${detalle.fechaRechazo}`} className="grid gap-1 rounded-md bg-background px-2.5 py-2 text-xs text-foreground">
                                    <span>Cheque {detalle.nroCheque}</span>
                                    <span>Rechazo {formatCentralDeudoresDate(detalle.fechaRechazo)}</span>
                                    <span>{formatCentralDeudoresMoney(detalle.monto, "")}</span>
                                    <span>{detalle.estadoMulta ?? "Sin estado multa"}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border border-dashed border-border bg-muted px-3 py-5 text-center text-sm text-muted-foreground">
                    No hay cheques rechazados informados para esta identificacion.
                  </div>
                )}
              </section>
            </article>

            <article className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Deuda actual</p>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">Entidades informantes</h2>
                </div>
                <span className="text-xs text-muted-foreground">{formatPeriodo(viewModel.deudaActual.periodo)}</span>
              </div>

              {viewModel.deudaActual.error ? (
                <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {viewModel.deudaActual.error}
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {viewModel.deudaActual.entidades.length ? (
                    viewModel.deudaActual.entidades.map((entidad) => {
                      const tone = getSituacionTone(entidad.situacion);
                      const flags = FLAG_LABELS.filter(({ key }) => Boolean((entidad as Record<string, unknown>)[key]));

                      return (
                        <div key={`${entidad.entidad}-${entidad.situacion}-${entidad.monto}`} className="rounded-md border border-border bg-muted px-3 py-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{entidad.entidad}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatCentralDeudoresMoney(entidad.monto)}</span>
                                <span>Atraso: {entidad.diasAtrasoPago} dias</span>
                                <span>Situacion 1 desde {formatCentralDeudoresDate(entidad.fechaSit1)}</span>
                              </div>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.chipClassName}`}>
                              S{entidad.situacion}
                            </span>
                          </div>

                          {flags.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {flags.map((flag) => (
                                <span key={flag.key} className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  {flag.label}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-md border border-dashed border-border bg-muted px-3 py-5 text-center text-sm text-muted-foreground">
                      Sin entidades informadas en el ultimo periodo.
                    </div>
                  )}
                </div>
              )}
            </article>

            <article className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
              <div className="border-b border-border pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Historicas</p>
                <h2 className="text-base font-semibold tracking-tight text-foreground">Ultimos 24 meses</h2>
              </div>

              {viewModel.historicas.error ? (
                <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {viewModel.historicas.error}
                </div>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {viewModel.timeline.length ? (
                    viewModel.timeline.map((periodo) => (
                      <div
                        key={periodo.periodo}
                        className={`rounded-md border px-3 py-2 ${periodo.riesgoVisual.borderClassName} ${periodo.riesgoVisual.softClassName}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{formatPeriodo(periodo.periodo)}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${periodo.riesgoVisual.chipClassName}`}>
                            {periodo.peorSituacionLabel}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{periodo.cantidadEntidades} entidades</span>
                          <span>{formatCentralDeudoresMoney(periodo.montoTotal)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md border border-dashed border-border bg-muted px-3 py-5 text-center text-sm text-muted-foreground">
                      Sin historial disponible.
                    </div>
                  )}
                </div>
              )}
            </article>

          </section>
        ) : null}
      </div>
    </div>
  );
}
