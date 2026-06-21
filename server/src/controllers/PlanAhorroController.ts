import type { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import { logError } from "../utils/logError";
import { promedioVentasPlanAhorroQuery } from "./querys/planAhorro.query";
import { buildPlanAhorroMonthRange, buildReportePromediosPlanAhorro, type PromedioPlanAhorroRow } from "../utils/reportPromediosPlanAhorro";

const parseYear = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 9999 ? parsed : null;
};

const getHastaMes = (ano: number) => {
  const today = new Date();
  const currentYear = today.getFullYear();

  return ano === currentYear ? today.getMonth() + 1 : 12;
};

export class PlanAhorroController {
  static promedioVentas = async (req: Request, res: Response) => {
    const ano = parseYear(req.params.ano);

    if (!ano) {
      return res.status(400).json({ message: "Periodo no valido" });
    }

    const hastaMes = getHastaMes(ano);
    const meses = buildPlanAhorroMonthRange(ano, hastaMes);

    try {
      const query = promedioVentasPlanAhorroQuery();
      const mesesConRows = await Promise.all(
        meses.map(async (mes) => {
          const rows = await sequelizeNIC.query<PromedioPlanAhorroRow>(query, {
            type: QueryTypes.SELECT,
            replacements: { ano, mes: mes.mes },
          });

          return { mes, rows };
        }),
      );

      const resumen = buildReportePromediosPlanAhorro(ano, hastaMes, mesesConRows);

      return res.status(200).json({ resumen });
    } catch (error) {
      logError("PlanAhorroController.promedioVentas");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };
}
