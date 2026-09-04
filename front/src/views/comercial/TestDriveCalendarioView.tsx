import { getTestDriveOptions, getTestDriveRegistros, type TestDriveNegocio } from "@/api/testDriveRegistroAPI";
import type { TestDriveOption, TestDriveRegistro } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, ListFilter, Rows3 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type CalendarMode = "month" | "week";
type MonthEvent = TestDriveRegistro & { startDay: number; endDay: number; lane: number };

type TestDriveCalendarioViewProps = {
  negocio: TestDriveNegocio;
  sectionLabel: string;
  title: string;
  listPath: string;
  queryKeyPrefix: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HALF_HOUR_MS = 30 * 60 * 1000;
const WEEK_START_INDEX = 1;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
}

function startOfWeek(date: Date) {
  const current = startOfDay(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : WEEK_START_INDEX - day;
  return addDays(current, diff);
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  return endOfDay(addDays(start, 6));
}

function formatDayNumber(date: Date) {
  return date.toLocaleDateString("es-AR", { day: "numeric" });
}

function formatWeekDay(date: Date) {
  return date.toLocaleDateString("es-AR", { weekday: "short" });
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function formatShortDateTime(date: Date) {
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function buildMonthLanes(events: TestDriveRegistro[], monthStart: Date, monthEnd: Date): MonthEvent[] {
  const sorted = [...events]
    .map((event) => {
      const retiroAt = new Date(event.retiroAt);
      const regresoAt = new Date(event.regresoAt);
      const visibleStart = retiroAt < monthStart ? monthStart : retiroAt;
      const visibleEnd = regresoAt > monthEnd ? monthEnd : regresoAt;
      const startDay = clamp(Math.floor((startOfDay(visibleStart).getTime() - startOfDay(monthStart).getTime()) / DAY_MS), 0, 31);
      const endDay = clamp(Math.floor((startOfDay(visibleEnd).getTime() - startOfDay(monthStart).getTime()) / DAY_MS), 0, 31);

      return {
        ...event,
        startDay,
        endDay,
        lane: 0,
      };
    })
    .sort((a, b) => new Date(a.retiroAt).getTime() - new Date(b.retiroAt).getTime());

  const laneEndDays: number[] = [];

  return sorted.map((event) => {
    let lane = laneEndDays.findIndex((laneEndDay) => laneEndDay < event.startDay);
    if (lane === -1) {
      lane = laneEndDays.length;
      laneEndDays.push(event.endDay);
    } else {
      laneEndDays[lane] = event.endDay;
    }

    return { ...event, lane };
  });
}

function MonthRow({
  unidad,
  events,
  monthDays,
}: {
  unidad: TestDriveOption;
  events: TestDriveRegistro[];
  monthDays: Date[];
}) {
  const monthStart = startOfDay(monthDays[0]);
  const monthEnd = endOfDay(monthDays[monthDays.length - 1]);
  const laidOutEvents = useMemo(
    () => buildMonthLanes(events, monthStart, monthEnd),
    [events, monthStart, monthEnd],
  );
  const laneCount = Math.max(1, ...laidOutEvents.map((event) => event.lane + 1));
  const rowHeight = Math.max(72, laneCount * 34 + 12);

  return (
    <div className="grid grid-cols-[220px_minmax(960px,1fr)] border-b border-border">
      <div className="border-r border-border bg-card px-3 py-2">
        <div className="font-semibold text-card-foreground">{unidad.dominio}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{unidad.versionNombre}</div>
      </div>

      <div className="relative overflow-x-auto">
        <div
          className="relative min-w-[960px]"
          style={{
            height: `${rowHeight}px`,
          }}
        >
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${monthDays.length}, minmax(0, 1fr))` }}>
            {monthDays.map((day) => (
              <div
                key={day.toISOString()}
                className={isWeekend(day) ? "h-full border-r border-border bg-muted" : "h-full border-r border-border bg-background"}
              />
            ))}
          </div>

          {laidOutEvents.map((event) => {
            const span = Math.max(1, event.endDay - event.startDay + 1);
            return (
              <div
                key={event._id}
                className="absolute overflow-hidden rounded-md border border-primary bg-primary px-2 py-1 text-primary-foreground shadow-sm"
                style={{
                  left: `calc(${(event.startDay / monthDays.length) * 100}% + 4px)`,
                  width: `calc(${(span / monthDays.length) * 100}% - 8px)`,
                  top: `${8 + event.lane * 34}px`,
                  height: "28px",
                }}
                title={`${event.solicitadoPorNombre} | ${formatShortDateTime(new Date(event.retiroAt))} - ${formatShortDateTime(new Date(event.regresoAt))}`}
              >
                <div className="flex items-center justify-between gap-3 text-[11px] font-medium leading-none">
                  <span className="truncate">
                    {formatTime(new Date(event.retiroAt))} - {formatTime(new Date(event.regresoAt))}
                  </span>
                  {event.starlink ? <span className="rounded-sm bg-primary-foreground/15 px-1.5 py-0.5 text-[10px]">StarLink</span> : null}
                </div>
                <div className="mt-1 truncate text-[10px] opacity-95">{event.solicitadoPorNombre}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthView({ units, records, visibleDate }: { units: TestDriveOption[]; records: TestDriveRegistro[]; visibleDate: Date }) {
  const monthStart = startOfMonth(visibleDate);
  const monthEnd = endOfMonth(visibleDate);
  const monthDays = Array.from(
    { length: Math.round((startOfDay(monthEnd).getTime() - startOfDay(monthStart).getTime()) / DAY_MS) + 1 },
    (_, index) => addDays(monthStart, index),
  );

  const recordsByUnit = useMemo(() => {
    const map = new Map<string, TestDriveRegistro[]>();
    units.forEach((unit) => map.set(unit._id, []));
    records.forEach((record) => {
      const current = map.get(record.unidadId) ?? [];
      current.push(record);
      map.set(record.unidadId, current);
    });
    return map;
  }, [units, records]);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="grid grid-cols-[220px_minmax(960px,1fr)] border-b border-border bg-muted text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <div className="border-r border-border px-3 py-2">Unidad</div>
        <div className="min-w-[960px]">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${monthDays.length}, minmax(0, 1fr))` }}>
            {monthDays.map((day) => (
              <div
                key={day.toISOString()}
                className={[
                  "border-r border-border px-2 py-2 text-center",
                  isWeekend(day) ? "bg-secondary" : "bg-muted",
                ].join(" ")}
              >
                <div className="font-semibold">{formatWeekDay(day)}</div>
                <div className="mt-0.5 text-sm font-semibold tracking-normal text-card-foreground">{formatDayNumber(day)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {units.map((unit) => (
        <MonthRow key={unit._id} unidad={unit} events={recordsByUnit.get(unit._id) ?? []} monthDays={monthDays} />
      ))}
    </section>
  );
}

function WeekUnitSection({
  unidad,
  events,
  weekDays,
}: {
  unidad: TestDriveOption;
  events: TestDriveRegistro[];
  weekDays: Date[];
}) {
  const slotsPerDay = 48;
  const slotHeight = 18;
  const gridHeight = slotsPerDay * slotHeight;
  const weekStart = startOfDay(weekDays[0]);
  const weekEnd = endOfDay(weekDays[weekDays.length - 1]);
  const eventSegments = events.flatMap((event) => {
    const start = new Date(event.retiroAt);
    const end = new Date(event.regresoAt);
    const visibleStart = start < weekStart ? weekStart : start;
    const visibleEnd = end > weekEnd ? weekEnd : end;
    const segmentCount =
      Math.floor((startOfDay(visibleEnd).getTime() - startOfDay(visibleStart).getTime()) / DAY_MS) + 1;

    return Array.from({ length: segmentCount }, (_, index) => {
      const dayDate = addDays(startOfDay(visibleStart), index);
      const dayStart = dayDate;
      const dayEnd = endOfDay(dayDate);
      const segmentStart = visibleStart > dayStart ? visibleStart : dayStart;
      const segmentEnd = visibleEnd < dayEnd ? visibleEnd : dayEnd;
      const dayIndex = clamp(Math.floor((dayDate.getTime() - weekStart.getTime()) / DAY_MS), 0, 6);

      return {
        event,
        segmentStart,
        segmentEnd,
        dayIndex,
      };
    });
  });

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-3 py-2">
        <div className="font-semibold text-card-foreground">{unidad.dominio}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{unidad.versionNombre}</div>
      </div>

      <div className="grid grid-cols-[72px_minmax(980px,1fr)]">
        <div className="border-r border-border bg-muted">
          {Array.from({ length: 24 }).map((_, hour) => (
            <div key={hour} className="h-9 border-b border-border px-2 text-[11px] font-medium text-muted-foreground">
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid border-b border-border bg-muted" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={[
                    "border-r border-border px-3 py-2 text-center text-xs uppercase tracking-[0.16em] text-muted-foreground",
                    isWeekend(day) ? "bg-secondary" : "bg-muted",
                  ].join(" ")}
                >
                  <div>{formatWeekDay(day)}</div>
                  <div className="mt-0.5 text-sm font-semibold tracking-normal text-card-foreground">{formatDayNumber(day)}</div>
                </div>
              ))}
            </div>

            <div
              className="relative"
              style={{
                height: `${gridHeight}px`,
              }}
            >
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className={isWeekend(day) ? "h-full border-r border-border bg-muted" : "h-full border-r border-border bg-background"} />
                ))}
              </div>
              <div className="absolute inset-0 grid grid-rows-[repeat(48,minmax(0,1fr))]">
                {Array.from({ length: 48 }).map((_, index) => <div key={index} className="border-b border-border" />)}
              </div>

              {eventSegments.map(({ event, segmentStart, segmentEnd, dayIndex }) => {
                const startMinutes = segmentStart.getHours() * 60 + segmentStart.getMinutes();
                const top = (startMinutes / 30) * slotHeight;
                const duration = Math.max(HALF_HOUR_MS, segmentEnd.getTime() - segmentStart.getTime());
                const height = Math.max(28, (duration / HALF_HOUR_MS) * slotHeight);

                return (
                  <div
                    key={`${event._id}-${dayIndex}-${segmentStart.toISOString()}`}
                    className="absolute overflow-hidden rounded-md border border-primary bg-primary px-2 py-1 text-primary-foreground shadow-sm"
                    style={{
                      left: `calc(${(dayIndex / 7) * 100}% + 6px)`,
                      width: `calc(${100 / 7}% - 12px)`,
                      top: `${top}px`,
                      height: `${height}px`,
                    }}
                    title={`${event.dominio} | ${event.solicitadoPorNombre} | ${formatShortDateTime(new Date(event.retiroAt))} - ${formatShortDateTime(new Date(event.regresoAt))}`}
                  >
                    <div className="text-[11px] font-semibold">
                      {formatTime(segmentStart)} - {formatTime(segmentEnd)}
                    </div>
                    <div className="mt-1 truncate text-[10px]">{event.solicitadoPorNombre}</div>
                    {event.starlink ? <div className="mt-2 text-[10px] font-semibold">StarLink</div> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeekView({ units, records, visibleDate }: { units: TestDriveOption[]; records: TestDriveRegistro[]; visibleDate: Date }) {
  const weekStart = startOfWeek(visibleDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekEnd = endOfWeek(visibleDate);

  const recordsByUnit = useMemo(() => {
    const map = new Map<string, TestDriveRegistro[]>();
    units.forEach((unit) => map.set(unit._id, []));

    records.forEach((record) => {
      const start = new Date(record.retiroAt);
      const end = new Date(record.regresoAt);
      if (start < weekEnd && end > weekStart) {
        const current = map.get(record.unidadId) ?? [];
        current.push(record);
        map.set(record.unidadId, current);
      }
    });

    return map;
  }, [units, records, weekStart, weekEnd]);

  return (
    <div className="space-y-3">
      {units.map((unit) => (
        <WeekUnitSection key={unit._id} unidad={unit} events={recordsByUnit.get(unit._id) ?? []} weekDays={weekDays} />
      ))}
    </div>
  );
}

export default function TestDriveCalendarioView({
  negocio,
  sectionLabel,
  title,
  listPath,
  queryKeyPrefix,
}: TestDriveCalendarioViewProps) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [selectedUnidadId, setSelectedUnidadId] = useState("");

  const range = useMemo(() => {
    if (calendarMode === "month") {
      const from = startOfMonth(visibleDate);
      const to = endOfMonth(visibleDate);
      return { from, to };
    }

    const from = startOfWeek(visibleDate);
    const to = endOfWeek(visibleDate);
    return { from, to };
  }, [calendarMode, visibleDate]);

  const { data: optionsResponse, isLoading: loadingUnits } = useQuery({
    queryKey: [queryKeyPrefix, "opciones", "activas"],
    queryFn: () => getTestDriveOptions(negocio),
  });

  const { data: recordsResponse, isLoading: loadingRecords, isError, error } = useQuery({
    queryKey: [
      queryKeyPrefix,
      "calendario",
      calendarMode,
      range.from.toISOString(),
      range.to.toISOString(),
      selectedUnidadId,
    ],
    queryFn: () =>
      getTestDriveRegistros({
        negocio,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        unidadId: selectedUnidadId || undefined,
      }),
  });

  const units = useMemo(() => {
    const allUnits = optionsResponse?.data ?? [];
    return selectedUnidadId ? allUnits.filter((unit) => unit._id === selectedUnidadId) : allUnits;
  }, [optionsResponse, selectedUnidadId]);

  const records = useMemo(() => recordsResponse?.data ?? [], [recordsResponse]);

  const handlePrev = () => {
    setVisibleDate((current) =>
      calendarMode === "month"
        ? new Date(current.getFullYear(), current.getMonth() - 1, 1)
        : addDays(current, -7),
    );
  };

  const handleNext = () => {
    setVisibleDate((current) =>
      calendarMode === "month"
        ? new Date(current.getFullYear(), current.getMonth() + 1, 1)
        : addDays(current, 7),
    );
  };

  const handleToday = () => setVisibleDate(new Date());

  if (loadingUnits || loadingRecords) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">Cargando calendario de TestDrive...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card p-3 text-destructive shadow-sm">
          {error instanceof Error ? error.message : "Error al cargar el calendario de TestDrive"}
        </div>
      </div>
    );
  }

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{sectionLabel}</p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-card-foreground">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Consulta la ocupacion de las unidades por rango de fechas y horas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={listPath}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
            >
              <ArrowLeft size={16} />
              Volver al listado
            </Link>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCalendarMode("month")}
              className={[
                "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                calendarMode === "month"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              <LayoutGrid size={16} />
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode("week")}
              className={[
                "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                calendarMode === "week"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              <Rows3 size={16} />
              Semanal
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3">
              <ListFilter size={15} className="text-muted-foreground" />
              <select
                value={selectedUnidadId}
                onChange={(event) => setSelectedUnidadId(event.target.value)}
                className="bg-transparent text-sm font-medium text-foreground outline-none"
              >
                <option value="">Todas las unidades</option>
                {(optionsResponse?.data ?? []).map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.dominio} - {unit.versionNombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-1">
              <button type="button" onClick={handlePrev} className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={handleToday} className="rounded-md px-2 text-sm font-semibold text-foreground transition hover:bg-secondary">
                Hoy
              </button>
              <button type="button" onClick={handleNext} className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
          <CalendarDays size={14} />
          {calendarMode === "month" ? formatMonthTitle(visibleDate) : `Semana del ${range.from.toLocaleDateString("es-AR")} al ${range.to.toLocaleDateString("es-AR")}`}
        </div>
      </section>

      {units.length === 0 ? (
        <section className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground shadow-sm">
          No hay unidades activas para mostrar en el calendario.
        </section>
      ) : calendarMode === "month" ? (
        <MonthView units={units} records={records} visibleDate={visibleDate} />
      ) : (
        <WeekView units={units} records={records} visibleDate={visibleDate} />
      )}

      {!records.length ? (
        <section className="rounded-lg border border-dashed border-border bg-card p-3 text-sm text-muted-foreground shadow-sm">
          No hay reservas en el rango visible. Las unidades siguen mostrandose para que puedas revisar disponibilidad.
        </section>
      ) : null}
    </div>
  );
}
