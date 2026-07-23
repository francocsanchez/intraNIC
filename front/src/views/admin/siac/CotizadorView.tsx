import Loading from "@/components/Loading";
import { getCotizadorCatalogo } from "@/api/dms/cotizadorAPI";
import { hasCotizadorManageAccess, hasModuleAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import {
  calcCft,
  calcFrances,
  calcPlazoFijo,
  formatMoney,
  formatMoneyInput,
  formatPercent,
  getCurrentMonthValue,
  parseMoneyInput,
  parseNumericInput,
  sanitizeDecimalInput,
} from "@/views/admin/siac/cotizadorUtils";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Building2, Calculator, CarFront, HandCoins, Landmark, Percent, Printer, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function CotizadorView() {
  const { user } = useAuth();
  const mesActual = getCurrentMonthValue();
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedEntidad, setSelectedEntidad] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlazoId, setSelectedPlazoId] = useState("");
  const [pfTna, setPfTna] = useState("19");
  const [descPct, setDescPct] = useState("");
  const [descMonto, setDescMonto] = useState("");
  const [tradeIn, setTradeIn] = useState("");
  const [anticipo, setAnticipo] = useState("");

  const canManageConfig = hasModuleAccess(user, "cotizador") && hasCotizadorManageAccess(user);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["cotizador-catalogo", mesActual],
    queryFn: () => getCotizadorCatalogo(mesActual),
  });

  const versiones = data?.data.versiones ?? [];
  const entidades = data?.data.entidades ?? [];
  const planes = data?.data.planes ?? [];

  useEffect(() => {
    if (!versiones.length) {
      return;
    }

    if (!selectedVersionId || !versiones.some((item) => item._id === selectedVersionId)) {
      const firstAvailable = versiones.find((item) => item.precio !== null) ?? versiones[0];
      setSelectedVersionId(firstAvailable._id);
    }
  }, [selectedVersionId, versiones]);

  useEffect(() => {
    if (!entidades.length) {
      return;
    }

    if (!selectedEntidad || !entidades.includes(selectedEntidad)) {
      setSelectedEntidad(entidades[0]);
    }
  }, [entidades, selectedEntidad]);

  const filteredPlans = useMemo(
    () => planes.filter((plan) => plan.entidad === selectedEntidad),
    [planes, selectedEntidad],
  );

  useEffect(() => {
    if (!filteredPlans.length) {
      setSelectedPlanId("");
      return;
    }

    if (!selectedPlanId || !filteredPlans.some((plan) => plan._id === selectedPlanId)) {
      setSelectedPlanId(filteredPlans[0]._id);
    }
  }, [filteredPlans, selectedPlanId]);

  const selectedPlan = filteredPlans.find((plan) => plan._id === selectedPlanId) ?? null;

  useEffect(() => {
    if (!selectedPlan?.plazos.length) {
      setSelectedPlazoId("");
      return;
    }

    if (!selectedPlazoId || !selectedPlan.plazos.some((term) => term._id === selectedPlazoId)) {
      setSelectedPlazoId(selectedPlan.plazos[0]._id);
    }
  }, [selectedPlan, selectedPlazoId]);

  const selectedVersion = versiones.find((item) => item._id === selectedVersionId) ?? null;
  const selectedPlazo = selectedPlan?.plazos.find((item) => item._id === selectedPlazoId) ?? null;

  const precioLista = selectedVersion?.precio ?? 0;
  const descuentoReferenciaPct = selectedVersion?.descuentoReferenciaPct ?? 8;
  const descPctValue = parseNumericInput(descPct);
  const descMontoValue = parseMoneyInput(descMonto);
  const tradeInValue = parseMoneyInput(tradeIn);
  const anticipoValue = parseMoneyInput(anticipo);
  const descMontoResolved = descMonto ? descMontoValue : precioLista * (descPctValue / 100);
  const descPctResolved = precioLista > 0 ? (descPct ? descMontoResolved / precioLista * 100 : descPctValue) : 0;
  const precioVenta = Math.max(0, precioLista - descMontoResolved);
  const maxFinanciable = selectedPlazo
    ? selectedPlazo.maxFinanciacionTipo === "porcentaje"
      ? precioVenta * (selectedPlazo.maxFinanciacionValor / 100)
      : selectedPlazo.maxFinanciacionValor
    : 0;
  const capitalBruto = Math.max(0, precioVenta - tradeInValue - anticipoValue);
  const capitalFinanciado = Math.max(0, selectedPlazo ? Math.min(capitalBruto, maxFinanciable) : capitalBruto);
  const quebrantoBase = selectedPlazo
    ? selectedPlazo.quebrantoTipo === "porcentaje"
      ? capitalFinanciado * (selectedPlazo.quebrantoValor / 100)
      : selectedPlazo.quebrantoValor
    : 0;
  const quebrantoIva = quebrantoBase * 0.21;
  const quebranto = quebrantoBase + quebrantoIva;
  const excesoCapital = Math.max(0, capitalBruto - capitalFinanciado);
  const descuentoTotal = descMontoResolved + quebranto;
  const descuentoCombinadoPct = precioLista > 0 ? (descuentoTotal / precioLista) * 100 : 0;
  const quebrantoSobreListaPct = precioLista > 0 ? (quebranto / precioLista) * 100 : 0;
  const cuotaRows = selectedPlazo ? calcFrances(capitalFinanciado, selectedPlazo.tna, selectedPlazo.plazo) : [];
  const totalFinanciado = cuotaRows.reduce((acc, row) => acc + row.total, 0);
  const cuotaPromedio = selectedPlazo?.plazo ? totalFinanciado / selectedPlazo.plazo : 0;
  const cft = calcCft(capitalFinanciado, cuotaRows);
  const totalIntereses = cuotaRows.reduce((acc, row) => acc + row.interes + row.ivaInt, 0);
  const plazoFijoTna = parseNumericInput(pfTna);
  const rendimientoPlazoFijo = selectedPlazo ? calcPlazoFijo(capitalFinanciado, plazoFijoTna, selectedPlazo.plazo) : 0;
  const resultadoPlazoFijo = rendimientoPlazoFijo - totalIntereses;

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-3 py-3">
        <section className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar el cotizador</h1>
          <p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "No fue posible obtener el catalogo"}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 px-3 py-3">
      <div className="space-y-3 print:hidden">
      <section className="overflow-hidden rounded-2xl border border-[#eadfce] bg-[linear-gradient(135deg,#fff7ec_0%,#f5f8ff_100%)] shadow-sm">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b5d2c]">Credito multimarca</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Cotizador multi-entidad</h1>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              Simula financiacion con lista mensual por version y planes bancarios configurables por entidad, plan y plazo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              <Printer size={14} />
              Imprimir
            </button>
            {canManageConfig ? (
              <>
                <Link
                  to={paths.admin.cotizadorPrecios}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  <Wallet size={14} />
                  Precios mensuales
                </Link>
                <Link
                  to={paths.admin.cotizadorPlanes}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  <Building2 size={14} />
                  Administrar planes
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="space-y-3">
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CarFront className="text-[#15aa9a]" size={18} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Paso 1</p>
                <h2 className="text-base font-semibold text-gray-900">Vehiculo y precio mensual</h2>
              </div>
            </div>

            <div className="grid gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-700">
                Version
                <select
                  value={selectedVersionId}
                  onChange={(event) => setSelectedVersionId(event.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
                >
                  {versiones.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.nombre}
                      {item.precio === null ? " · sin precio" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {selectedVersion?.precio !== null ? (
                <span>
                  Precio de lista vigente para <strong>{mesActual}</strong>: <strong className="text-gray-900">{formatMoney(precioLista)}</strong>
                </span>
              ) : (
                <span className="text-red-600">La version seleccionada no tiene precio mensual cargado para {mesActual}.</span>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Percent className="text-[#15aa9a]" size={18} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Paso 2</p>
                <h2 className="text-base font-semibold text-gray-900">Descuento sobre unidad</h2>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-700">
                Descuento %
                <input
                  type="text"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  value={descPct}
                  onChange={(event) => {
                    const value = sanitizeDecimalInput(event.target.value, 2);
                    setDescPct(value);
                    const parsed = parseNumericInput(value);
                    setDescMonto(precioLista > 0 ? formatMoneyInput(Math.round((precioLista * parsed) / 100)) : "");
                  }}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-700">
                Descuento $
                <input
                  type="text"
                  inputMode="numeric"
                  min={0}
                  value={descMonto}
                  onChange={(event) => {
                    const value = formatMoneyInput(event.target.value);
                    setDescMonto(value);
                    const parsed = parseMoneyInput(value);
                    setDescPct(precioLista > 0 ? sanitizeDecimalInput(((parsed / precioLista) * 100).toFixed(2), 2) : "");
                  }}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
                />
              </label>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Precio de venta</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">{formatMoney(precioVenta)}</p>
              </div>
            </div>

            {descPctResolved > descuentoReferenciaPct ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">
                <AlertTriangle size={13} className="flex-none" />
                <span>El descuento de lista supera el {formatPercent(descuentoReferenciaPct)} de referencia.</span>
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <HandCoins className="text-[#15aa9a]" size={18} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Paso 3</p>
                <h2 className="text-base font-semibold text-gray-900">Anticipo y usado</h2>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-700">
                Usado $
                <input
                  type="text"
                  inputMode="numeric"
                  min={0}
                  value={tradeIn}
                  onChange={(event) => setTradeIn(formatMoneyInput(event.target.value))}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-700">
                Anticipo $
                <input
                  type="text"
                  inputMode="numeric"
                  min={0}
                  value={anticipo}
                  onChange={(event) => setAnticipo(formatMoneyInput(event.target.value))}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
                />
              </label>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Landmark className="text-[#15aa9a]" size={18} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Paso 4</p>
                <h2 className="text-base font-semibold text-gray-900">Entidad, plan y plazo</h2>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-700">
                Entidad financiera
                <select
                  value={selectedEntidad}
                  onChange={(event) => setSelectedEntidad(event.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
                >
                  {entidades.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2 md:grid-cols-2">
                {filteredPlans.map((plan) => (
                  <button
                    key={plan._id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan._id)}
                    className={[
                      "rounded-xl border px-3 py-2.5 text-left transition",
                      selectedPlanId === plan._id
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:border-gray-400",
                    ].join(" ")}
                  >
                    <div className="text-xs uppercase tracking-[0.18em] opacity-70">{plan.entidad}</div>
                    <div className="mt-0.5 text-sm font-semibold">{plan.nombre}</div>
                    <div className="mt-1 text-[11px] opacity-80">{plan.plazos.length} plazos disponibles</div>
                  </button>
                ))}
              </div>

              {selectedPlan ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPlan.plazos.map((term) => (
                    <button
                      key={term._id}
                      type="button"
                      onClick={() => setSelectedPlazoId(term._id)}
                      className={[
                        "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                        selectedPlazoId === term._id
                          ? "border-[#15aa9a] bg-[#15aa9a] text-white"
                          : "border-gray-200 bg-white text-gray-900 hover:border-gray-400",
                      ].join(" ")}
                    >
                      {term.plazo} meses · {formatPercent(term.tna)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        </div>

        <div className="space-y-3">
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Calculator className="text-[#15aa9a]" size={18} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Resultado</p>
                <h2 className="text-base font-semibold text-gray-900">Resumen de simulacion</h2>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-900 px-3 py-3 text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Cuota promedio</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{formatMoney(cuotaPromedio)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Capital financiado</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">{formatMoney(capitalFinanciado)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">TNA</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">{selectedPlazo ? formatPercent(selectedPlazo.tna) : "-"}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">CFT estimado</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">{formatPercent(cft)}</p>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
              <div className="flex items-center justify-between">
                <span>Precio de lista</span>
                <strong>{formatMoney(precioLista)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Descuento lista</span>
                <strong>{formatMoney(descMontoResolved)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Quebranto concesionario ({formatPercent(quebrantoSobreListaPct)})</span>
                <strong>{formatMoney(quebranto)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Usado + anticipo</span>
                <strong>{formatMoney(tradeInValue + anticipoValue)}</strong>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-1.5">
                <span>Capital solicitado</span>
                <strong>{formatMoney(capitalBruto)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Maximo financiable</span>
                <strong>{formatMoney(maxFinanciable)}</strong>
              </div>
            </div>

            {selectedVersion?.precio === null ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] text-red-700">
                <AlertTriangle size={13} className="flex-none" />
                <span>No se puede simular hasta que exista un precio mensual activo para esta version.</span>
              </div>
            ) : null}

            {excesoCapital > 0 ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">
                <AlertTriangle size={13} className="flex-none" />
                <span>
                  El capital supera el maximo financiable del plan. Debes sumar al menos {formatMoney(excesoCapital)} de anticipo adicional para entrar en el tope.
                </span>
              </div>
            ) : null}

            {descuentoCombinadoPct > 8 ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">
                <AlertTriangle size={13} className="flex-none" />
                <span>El descuento total dealer + plan alcanza {formatPercent(descuentoCombinadoPct)} sobre lista.</span>
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Comparativo</p>
                <h2 className="text-base font-semibold text-gray-900">Plazo fijo</h2>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                TNA PF
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={pfTna}
                  onChange={(event) => setPfTna(event.target.value)}
                  className="w-20 rounded-xl border border-gray-300 px-2.5 py-1.5 text-xs outline-none focus:border-[#15aa9a]"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 px-3 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Rendimiento PF</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">{formatMoney(rendimientoPlazoFijo)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Intereses + IVA credito</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">{formatMoney(totalIntereses)}</p>
              </div>
            </div>

            <div
              className={[
                "mt-3 rounded-xl px-3 py-2 text-xs font-medium",
                resultadoPlazoFijo >= 0
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-amber-200 bg-amber-50 text-amber-800",
              ].join(" ")}
            >
              Resultado neto estimado: <strong>{formatMoney(resultadoPlazoFijo)}</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Detalle de cuotas</h2>
            <p className="text-xs text-gray-500">
              {selectedPlan && selectedPlazo ? `${selectedPlan.nombre} · ${selectedPlazo.plazo} meses · TNA ${formatPercent(selectedPlazo.tna)}` : "Selecciona un plazo"}
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            <ArrowRight size={12} />
            {cuotaRows.length} cuotas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Cuota</th>
                <th className="px-3 py-2 text-right">Amortizacion</th>
                <th className="px-3 py-2 text-right">Interes</th>
                <th className="px-3 py-2 text-right">IVA interes</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cuotaRows.map((row) => (
                <tr key={row.cuota} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">Cuota {row.cuota}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatMoney(row.amort)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatMoney(row.interes)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatMoney(row.ivaInt)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatMoney(row.total)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatMoney(row.saldo)}</td>
                </tr>
              ))}
              {!cuotaRows.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">
                    Completa la seleccion del plan y asegurate de tener una version con precio mensual para generar la simulacion.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-2 md:grid-cols-4">
        <article className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Descuento lista</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-gray-900">{formatPercent(descPctResolved)}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Quebranto % capital</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
            {capitalFinanciado > 0 ? formatPercent((quebranto / capitalFinanciado) * 100) : formatPercent(0)}
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Descuento total</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-gray-900">{formatMoney(descuentoTotal)}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Capital/venta</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
            {precioVenta > 0 ? formatPercent((capitalFinanciado / precioVenta) * 100) : formatPercent(0)}
          </p>
        </article>
      </section>
      </div>

      <section className="dashboard-print-area hidden print:block">
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }

            .cotizador-print-sheet {
              color: #111827;
              font-size: 11px;
              line-height: 1.35;
            }

            .cotizador-print-card {
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 8px 10px;
              break-inside: avoid;
            }

            .cotizador-print-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }

            .cotizador-print-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }

            .cotizador-print-table th,
            .cotizador-print-table td {
              border: 1px solid #d1d5db;
              padding: 4px 6px;
            }

            .cotizador-print-table th {
              background: #f3f4f6;
              font-size: 10px;
              text-transform: uppercase;
            }
          }
        `}</style>

        <div className="cotizador-print-sheet space-y-2">
          <div className="border-b border-gray-300 pb-2">
            <h1 className="text-lg font-semibold text-gray-900">Simulacion de credito</h1>
            <p className="text-xs text-gray-600">Fecha de cotizacion: {mesActual}</p>
          </div>

          <div className="cotizador-print-grid">
            <div className="cotizador-print-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Vehiculo y precio</p>
              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span>Version</span>
                  <strong className="text-right">{selectedVersion?.nombre ?? "-"}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Precio de lista</span>
                  <strong>{formatMoney(precioLista)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Precio de venta</span>
                  <strong>{formatMoney(precioVenta)}</strong>
                </div>
              </div>
            </div>

            <div className="cotizador-print-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Descuento</p>
              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span>Descuento %</span>
                  <strong>{formatPercent(descPctResolved)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Descuento $</span>
                  <strong>{formatMoney(descMontoResolved)}</strong>
                </div>
              </div>
            </div>

            <div className="cotizador-print-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Anticipo y usado</p>
              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span>Usado</span>
                  <strong>{formatMoney(tradeInValue)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Anticipo</span>
                  <strong>{formatMoney(anticipoValue)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Capital financiado</span>
                  <strong>{formatMoney(capitalFinanciado)}</strong>
                </div>
              </div>
            </div>

            <div className="cotizador-print-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Entidad, plan y plazo</p>
              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span>Entidad</span>
                  <strong>{selectedEntidad || "-"}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Plan</span>
                  <strong className="text-right">{selectedPlan?.nombre ?? "-"}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Plazo</span>
                  <strong>{selectedPlazo ? `${selectedPlazo.plazo} meses` : "-"}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>TNA</span>
                  <strong>{selectedPlazo ? formatPercent(selectedPlazo.tna) : "-"}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="cotizador-print-card">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Detalle de cuotas</p>
              <strong>{cuotaRows.length} cuotas</strong>
            </div>

            <table className="cotizador-print-table">
              <thead>
                <tr>
                  <th className="text-left">Cuota</th>
                  <th className="text-right">Amort.</th>
                  <th className="text-right">Interes</th>
                  <th className="text-right">IVA</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {cuotaRows.map((row) => (
                  <tr key={`print-${row.cuota}`}>
                    <td>Cuota {row.cuota}</td>
                    <td className="text-right">{formatMoney(row.amort)}</td>
                    <td className="text-right">{formatMoney(row.interes)}</td>
                    <td className="text-right">{formatMoney(row.ivaInt)}</td>
                    <td className="text-right font-semibold">{formatMoney(row.total)}</td>
                    <td className="text-right">{formatMoney(row.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
