import { Request, Response } from "express";
import FinancialPlan from "../models/FinancialPlan";
import Version from "../models/Version";
import VersionPriceMonthly from "../models/VersionPriceMonthly";
import { logError } from "../utils/logError";

const getCurrentMonth = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

const normalizeMes = (value: unknown) => {
  const mes = typeof value === "string" ? value.trim() : "";
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(mes) ? mes : "";
};

export class CotizadorController {
  static catalogo = async (req: Request, res: Response) => {
    const mes = normalizeMes(req.query.mes) || getCurrentMonth();

    try {
      const [versiones, precios, planes] = await Promise.all([
        Version.find({ activo: true }).sort({ nombre: 1 }).lean(),
        VersionPriceMonthly.find({ mes, activo: true }).lean(),
        FinancialPlan.find({ activo: true }).sort({ entidad: 1, nombre: 1 }).lean(),
      ]);

      const preciosMap = new Map(precios.map((item) => [String(item.version), item]));
      const planesActivos = planes
        .map((plan) => ({
          ...plan,
          plazos: plan.plazos.filter((term) => term.activo),
        }))
        .filter((plan) => plan.plazos.length > 0);

      const entidades = Array.from(new Set(planesActivos.map((plan) => plan.entidad))).sort((a, b) => a.localeCompare(b, "es"));

      return res.status(200).json({
        data: {
          mes,
          versiones: versiones.map((version) => {
            const precio = preciosMap.get(String(version._id));
            return {
              _id: String(version._id),
              nombre: version.nombre,
              activo: version.activo,
              precioId: precio ? String(precio._id) : null,
              precio: precio?.precio ?? null,
              descuentoReferenciaPct: precio?.descuentoReferenciaPct ?? 8,
              precioActivo: precio?.activo ?? false,
            };
          }),
          entidades,
          planes: planesActivos,
        },
      });
    } catch (error) {
      logError("CotizadorController.catalogo");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener el catalogo del cotizador" });
    }
  };
}
