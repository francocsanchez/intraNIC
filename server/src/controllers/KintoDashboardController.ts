import type { Request, Response } from "express";
import KintoFlota from "../models/KintoFlota";
import KintoMatafuegoRecarga from "../models/KintoMatafuegoRecarga";
import KintoMulta from "../models/KintoMulta";
import { logError } from "../utils/logError";

const months = Array.from({ length: 12 }, (_, index) => index + 1);
const fineStatuses = ["PEND_COBRAR", "PEND_FACTURAR", "PEND_PAGAR", "PAGADO"] as const;
const categories = ["MATAFUEGOS", "MULTAS"] as const;
type FineStatus = (typeof fineStatuses)[number];
type Category = (typeof categories)[number];

const todayBuenosAires = () => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
};
const monthOf = (date: string) => Number(date.slice(5, 7));
const yearOf = (date: string) => Number(date.slice(0, 4));
const statusOf = (item: { cobrado: boolean; facturado: boolean; pagado: boolean }): FineStatus => item.pagado ? "PAGADO" : item.facturado ? "PEND_PAGAR" : item.cobrado ? "PEND_FACTURAR" : "PEND_COBRAR";
const safeText = (value: unknown) => typeof value === "string" ? value.trim() : "";
const number = (value: unknown) => typeof value === "string" && /^\d+$/.test(value) ? Number(value) : Number.NaN;
const daysUntil = (date: string, today: string) => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);

export class KintoDashboardController {
  static get = async (req: Request, res: Response) => {
    const currentYear = Number(todayBuenosAires().slice(0, 4));
    const year = number(req.query.anio) || currentYear;
    const month = safeText(req.query.mes) ? number(req.query.mes) : 0;
    const sucursal = safeText(req.query.sucursal);
    const category = safeText(req.query.categoria) as Category | "";
    const fineStatus = safeText(req.query.estadoMulta) as FineStatus | "";

    if (year < 2000 || year > currentYear + 1 || !Number.isInteger(month) || month < 0 || month > 12 || (category && !categories.includes(category as Category)) || (fineStatus && !fineStatuses.includes(fineStatus as FineStatus))) {
      return res.status(400).json({ error: "Los filtros del dashboard no son válidos" });
    }

    try {
      const [fleet, recargas, multas] = await Promise.all([
        KintoFlota.find({}).populate("sucursalEntrega", "nombre").lean(),
        KintoMatafuegoRecarga.find({}).lean(),
        KintoMulta.find({ deletedAt: null }).lean(),
      ]);

      const branchOfFleet = new Map(fleet.map((unit: any) => [String(unit._id), unit.sucursalEntrega?.nombre ?? "Sin asignar"]));
      const branchNames = new Set<string>([...branchOfFleet.values(), ...multas.map((item: any) => item.sucursal || "Sin asignar")]);
      const availableYears = Array.from(new Set([
        currentYear,
        ...recargas.map((item: any) => yearOf(item.fechaRecarga)),
        ...multas.map((item: any) => yearOf(item.fecha)),
      ].filter((item) => Number.isInteger(item) && item >= 2000))).sort((a, b) => b - a);

      const matchesBranch = (branch: string) => !sucursal || branch === sucursal;
      const visibleFleet = fleet.filter((unit: any) => matchesBranch(branchOfFleet.get(String(unit._id)) ?? "Sin asignar"));
      const activeFleet = visibleFleet.filter((unit: any) => unit.activo !== false);
      const activeById = new Set(activeFleet.map((unit: any) => String(unit._id)));
      const today = todayBuenosAires();
      const latestRecarga = new Map<string, any>();
      for (const item of recargas) {
        const id = String((item as any).flota);
        const current = latestRecarga.get(id);
        if (!current || `${item.fechaRecarga}-${item.createdAt}` > `${current.fechaRecarga}-${current.createdAt}`) latestRecarga.set(id, item);
      }

      const filteredRecargas = recargas.filter((item: any) =>
        (!category || category === "MATAFUEGOS") &&
        yearOf(item.fechaRecarga) === year && (!month || monthOf(item.fechaRecarga) === month) &&
        matchesBranch(branchOfFleet.get(String(item.flota)) ?? "Sin asignar"),
      );
      const filteredMultas = multas.filter((item: any) =>
        (!category || category === "MULTAS") &&
        yearOf(item.fecha) === year && (!month || monthOf(item.fecha) === month) &&
        matchesBranch(item.sucursal || "Sin asignar") &&
        (!fineStatus || statusOf(item) === fineStatus),
      );

      const expenseByMonth = months.map((value) => ({ month: value, matafuegos: 0, multas: 0, cantidadMatafuegos: 0, cantidadMultas: 0 }));
      for (const item of filteredRecargas) {
        const row = expenseByMonth[monthOf(item.fechaRecarga) - 1];
        row.matafuegos += Number(item.importeRecarga ?? 0); row.cantidadMatafuegos += 1;
      }
      for (const item of filteredMultas) {
        const row = expenseByMonth[monthOf(item.fecha) - 1];
        row.multas += Number(item.monto ?? 0); row.cantidadMultas += 1;
      }
      const visibleExpenseByMonth = month ? expenseByMonth.filter((item) => item.month === month) : expenseByMonth;
      const fineSummary = fineStatuses.map((status) => {
        const rows = filteredMultas.filter((item: any) => statusOf(item) === status);
        return { status, quantity: rows.length, amount: rows.reduce((total: number, item: any) => total + Number(item.monto ?? 0), 0) };
      });
      const pendingFineSummary = fineSummary.filter((item) => item.status !== "PAGADO");
      const matafuegos = activeFleet.reduce((total: { vencidos: number; proximos: number; sinRecarga: number }, unit: any) => {
        const latest = latestRecarga.get(String(unit._id));
        if (!latest) total.sinRecarga += 1;
        else if (latest.fechaVencimiento <= today) total.vencidos += 1;
        else if (daysUntil(latest.fechaVencimiento, today) <= 30) total.proximos += 1;
        return total;
      }, { vencidos: 0, proximos: 0, sinRecarga: 0 });

      const byBranch = Array.from(branchNames).filter(matchesBranch).sort((a, b) => a.localeCompare(b)).map((branch) => {
        const units = activeFleet.filter((unit: any) => (branchOfFleet.get(String(unit._id)) ?? "Sin asignar") === branch);
        const branchRecargas = filteredRecargas.filter((item: any) => (branchOfFleet.get(String(item.flota)) ?? "Sin asignar") === branch);
        const branchMultas = filteredMultas.filter((item: any) => item.sucursal === branch);
        const critical = units.filter((unit: any) => {
          const latest = latestRecarga.get(String(unit._id));
          return !latest || latest.fechaVencimiento <= today;
        }).length;
        const finePending = branchMultas.filter((item: any) => statusOf(item) !== "PAGADO");
        return {
          sucursal: branch, activeUnits: units.length, reporting: units.filter((unit: any) => unit.geotab === "Reportando").length,
          disconnected: units.filter((unit: any) => unit.geotab === "Sin Conexion").length, matafuegosCriticos: critical,
          matafuegosAmount: branchRecargas.reduce((total: number, item: any) => total + Number(item.importeRecarga ?? 0), 0),
          multasAmount: branchMultas.reduce((total: number, item: any) => total + Number(item.monto ?? 0), 0),
          multasPendientes: finePending.length, montoPendiente: finePending.reduce((total: number, item: any) => total + Number(item.monto ?? 0), 0),
        };
      });

      const reporting = activeFleet.filter((unit: any) => unit.geotab === "Reportando").length;
      const disconnected = activeFleet.length - reporting;
      const totalExpense = visibleExpenseByMonth.reduce((total, item) => total + item.matafuegos + item.multas, 0);
      return res.status(200).json({
        filtros: { anios: availableYears, sucursales: Array.from(branchNames).sort((a, b) => a.localeCompare(b)) },
        estadoActual: {
          unidadesActivas: activeFleet.length, unidadesInactivas: visibleFleet.length - activeFleet.length, reportando: reporting, sinConexion: disconnected,
          tasaConexion: activeFleet.length ? Math.round((reporting / activeFleet.length) * 1000) / 10 : 0,
          kmTotal: activeFleet.reduce((total: number, unit: any) => total + Number(unit.kmActual ?? unit.kmIniciales ?? 0), 0),
          kmPromedio: activeFleet.length ? Math.round(activeFleet.reduce((total: number, unit: any) => total + Number(unit.kmActual ?? unit.kmIniciales ?? 0), 0) / activeFleet.length) : 0,
          matafuegos,
        },
        gastos: { mensual: visibleExpenseByMonth.map((item) => ({ ...item, total: item.matafuegos + item.multas })), total: totalExpense, promedioPorUnidad: activeFleet.length ? totalExpense / activeFleet.length : 0 },
        multas: { estados: fineSummary, pendientesCantidad: pendingFineSummary.reduce((total, item) => total + item.quantity, 0), pendientesMonto: pendingFineSummary.reduce((total, item) => total + item.amount, 0) },
        sucursales: byBranch,
      });
    } catch (error) {
      logError("KintoDashboardController.get"); console.error(error);
      return res.status(500).json({ message: "No se pudo cargar el dashboard de Kinto" });
    }
  };
}
