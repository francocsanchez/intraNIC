import { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import mongoose from "mongoose";
import { sequelizeNIC } from "../config/database";
import { infoInternoQuery } from "./querys/convencional.query";
import PedidoUnidad from "../models/PedidoUnidad";
import PedidoUnidadPrevia, {
  PEDIDO_UNIDAD_PRIORIDADES,
  type PedidoUnidadPrioridad,
} from "../models/PedidoUnidadPrevia";
import { logError } from "../utils/logError";

type InfoInternoRow = {
  interno: number;
  version: string;
  order: string;
  cliente: string;
  vendedor: string;
  chasis: string | null;
  modelo: string;
};

type InternoArriboRow = {
  interno: number;
  fechaRecepcionRemito: string | null;
};

type PedidoUnidadPreviaResponseItem = {
  _id: mongoose.Types.ObjectId | string;
  interno: number;
  clienteNombre: string;
  vendedorNombre: string;
  chasis: string | null;
  version: string;
  modelo: string;
  prioridad: PedidoUnidadPrioridad;
  usuario_id: mongoose.Types.ObjectId | string;
  usuario: string;
  createdAt: Date;
  updatedAt: Date;
};

type PedidoUnidadPayloadItem = {
  interno: number;
  PDI?: boolean;
  prioridad?: PedidoUnidadPrioridad;
  listaPreviaCreatedAt?: string | null;
};

const PRIORIDAD_ORDER: Record<PedidoUnidadPrioridad, number> = {
  urgente: 0,
  media: 1,
  normal: 2,
};

const normalizeText = (value: unknown) => {
  if (typeof value !== "string") return "-";

  const normalized = value.trim();
  return normalized.length ? normalized : "-";
};

const normalizeNullableText = (value: unknown) => {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (!normalized || normalized === "-") return null;

  return normalized;
};

const normalizeNullableDate = (value: unknown) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const isValidPrioridad = (value: unknown): value is PedidoUnidadPrioridad =>
  typeof value === "string" && PEDIDO_UNIDAD_PRIORIDADES.includes(value as PedidoUnidadPrioridad);

const canManagePrioridad = (roles: string[] | undefined) =>
  (roles ?? []).some((role) => ["stock", "gerente", "admin"].includes(role));

const comparePedidoUnidadItem = (a: { prioridad: PedidoUnidadPrioridad; interno: number }, b: { prioridad: PedidoUnidadPrioridad; interno: number }) => {
  const priorityDiff = PRIORIDAD_ORDER[a.prioridad] - PRIORIDAD_ORDER[b.prioridad];
  if (priorityDiff !== 0) return priorityDiff;

  return a.interno - b.interno;
};

const comparePrevia = (a: { prioridad: PedidoUnidadPrioridad; createdAt: Date; interno: number }, b: { prioridad: PedidoUnidadPrioridad; createdAt: Date; interno: number }) => {
  const priorityDiff = PRIORIDAD_ORDER[a.prioridad] - PRIORIDAD_ORDER[b.prioridad];
  if (priorityDiff !== 0) return priorityDiff;

  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
};

const normalizePedidoUnidadItem = (item: any) => ({
  ...item,
  chasis: normalizeNullableText(item?.chasis),
  modelo: normalizeText(item?.modelo),
  prioridad: isValidPrioridad(item?.prioridad) ? item.prioridad : "normal",
  listaPreviaCreatedAt: normalizeNullableDate(item?.listaPreviaCreatedAt),
  listaPreviaUsuario: normalizeNullableText(item?.listaPreviaUsuario),
});

const normalizePedidoUnidad = (pedido: any) => ({
  ...pedido,
  items: Array.isArray(pedido?.items)
    ? pedido.items.map(normalizePedidoUnidadItem).sort(comparePedidoUnidadItem)
    : [],
});

const isValidFecha = (value: unknown) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getInternosYaPedidosSet = async (internos: number[], excludePedidoId?: string) => {
  if (!internos.length) return new Set<number>();

  const match: Record<string, unknown> = {
    "items.interno": { $in: internos },
  };

  if (excludePedidoId && mongoose.Types.ObjectId.isValid(excludePedidoId)) {
    match._id = { $ne: new mongoose.Types.ObjectId(excludePedidoId) };
  }

  const encontrados = await PedidoUnidad.aggregate([
    { $match: match },
    { $unwind: "$items" },
    { $match: { "items.interno": { $in: internos } } },
    { $group: { _id: "$items.interno" } },
  ]) as Array<{ _id: number }>;

  return new Set(encontrados.map((item) => item._id));
};

const removePreviasByInternos = async (internos: number[]) => {
  if (!internos.length) return;

  await PedidoUnidadPrevia.deleteMany({ interno: { $in: internos } });
};

const getInfoInternosMap = async (internos: number[]) => {
  const internosUnicos = Array.from(new Set(internos.filter((interno) => Number.isInteger(interno) && interno > 0)));
  if (!internosUnicos.length) {
    return new Map<number, InfoInternoRow>();
  }

  const unidades = await Promise.all(
    internosUnicos.map(async (interno) => {
      const rows = await sequelizeNIC.query<InfoInternoRow>(infoInternoQuery(), {
        type: QueryTypes.SELECT,
        replacements: { interno },
      });

      return rows[0] ?? null;
    }),
  );

  return new Map(
    unidades
      .filter((unidad): unidad is InfoInternoRow => Boolean(unidad?.interno))
      .map((unidad) => [unidad.interno, unidad]),
  );
};

const hydratePrevia = (
  previa: any,
  unidadActual?: InfoInternoRow | null,
): PedidoUnidadPreviaResponseItem => ({
  _id: previa._id,
  interno: previa.interno,
  clienteNombre: normalizeText(unidadActual?.cliente),
  vendedorNombre: normalizeText(unidadActual?.vendedor),
  chasis: normalizeNullableText(unidadActual?.chasis),
  version: normalizeText(unidadActual?.version),
  modelo: normalizeText(unidadActual?.modelo),
  prioridad: isValidPrioridad(previa?.prioridad) ? previa.prioridad : "normal",
  usuario_id: previa.usuario_id,
  usuario: normalizeText(previa?.usuario),
  createdAt: new Date(previa.createdAt),
  updatedAt: new Date(previa.updatedAt),
});

const buildPedidoItems = async (
  items: PedidoUnidadPayloadItem[],
  options: {
    excludePedidoId?: string;
    userRoles?: string[];
    existingItems?: Array<{
      interno: number;
      prioridad: PedidoUnidadPrioridad;
      listaPreviaCreatedAt?: Date | string | null;
      listaPreviaUsuario?: string | null;
    }>;
  } = {},
) => {
  const internosUnicos = Array.from(
    new Set(
      items.map((item) => Number(item.interno)).filter((interno) => Number.isInteger(interno) && interno > 0),
    ),
  );

  if (!internosUnicos.length) {
    throw new Error("Debes ingresar al menos un interno valido");
  }

  if (internosUnicos.length > 8) {
    throw new Error("Solo se permiten hasta 8 unidades por pedido");
  }

  if (internosUnicos.length !== items.length) {
    throw new Error("No se pueden repetir internos dentro del mismo pedido");
  }

  const internosYaPedidos = await getInternosYaPedidosSet(internosUnicos, options.excludePedidoId);
  if (internosYaPedidos.size) {
    throw new Error(
      `Esta unidad ya fue pedida: ${Array.from(internosYaPedidos).join(", ")}`,
    );
  }

  const unidadesMap = await getInfoInternosMap(internosUnicos);

  const faltantes = internosUnicos.filter((interno) => !unidadesMap.has(interno));
  if (faltantes.length) {
    throw new Error(`No se encontro informacion para los internos: ${faltantes.join(", ")}`);
  }

  const previas = await PedidoUnidadPrevia.find({ interno: { $in: internosUnicos } }).lean();
  const previasByInterno = new Map(previas.map((previa) => [previa.interno, previa]));
  const existingByInterno = new Map((options.existingItems ?? []).map((item) => [item.interno, item]));
  const userCanManagePrioridad = canManagePrioridad(options.userRoles);

  return items.map((item) => {
    const interno = Number(item.interno);
    const unidad = unidadesMap.get(interno);
    const previa = previasByInterno.get(interno);
    const existingItem = existingByInterno.get(interno);

    if (!unidad) {
      throw new Error(`No se encontro informacion para el interno ${interno}`);
    }

    return {
      interno: unidad.interno,
      version: normalizeText(unidad.version),
      order: normalizeText(unidad.order),
      cliente: normalizeText(unidad.cliente),
      vendedor: normalizeText(unidad.vendedor),
      chasis: normalizeNullableText(unidad.chasis),
      modelo: normalizeText(unidad.modelo),
      prioridad: userCanManagePrioridad && isValidPrioridad(item.prioridad)
        ? item.prioridad
        : existingItem?.prioridad ?? previa?.prioridad ?? "normal",
      listaPreviaCreatedAt: normalizeNullableDate(existingItem?.listaPreviaCreatedAt ?? previa?.createdAt),
      listaPreviaUsuario: normalizeNullableText(existingItem?.listaPreviaUsuario ?? previa?.usuario),
      PDI: Boolean(item.PDI),
    };
  }).sort(comparePedidoUnidadItem);
};

export class PedidoUnidadController {
  static getInfoInterno = async (req: Request, res: Response) => {
    const interno = Number(req.params.interno);

    if (!Number.isInteger(interno) || interno <= 0) {
      return res.status(400).json({ error: "El interno ingresado no es valido" });
    }

    try {
      const internosYaPedidos = await getInternosYaPedidosSet([interno]);
      if (internosYaPedidos.has(interno)) {
        return res.status(409).json({ error: "Esta unidad ya fue pedida" });
      }

      const data = await sequelizeNIC.query<InfoInternoRow>(infoInternoQuery(), {
        type: QueryTypes.SELECT,
        replacements: { interno },
      });

      const unidad = data[0];

      if (!unidad) {
        return res.status(404).json({ error: "No se encontro informacion para el interno solicitado" });
      }

      return res.status(200).json({
        data: {
          interno: unidad.interno,
          version: normalizeText(unidad.version),
          order: normalizeText(unidad.order),
          cliente: normalizeText(unidad.cliente),
          vendedor: normalizeText(unidad.vendedor),
          chasis: normalizeNullableText(unidad.chasis),
          modelo: normalizeText(unidad.modelo),
        },
      });
    } catch (error) {
      logError("PedidoUnidadController.getInfoInterno");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static listPrevias = async (_req: Request, res: Response) => {
    try {
      const previas = await PedidoUnidadPrevia.find().lean();
      const internos = previas.map((item) => item.interno);
      const internosYaPedidos = await getInternosYaPedidosSet(internos);
      const internosDisponibles = previas
        .filter((item) => !internosYaPedidos.has(item.interno))
        .map((item) => item.interno);
      const unidadesMap = await getInfoInternosMap(internosDisponibles);
      const data = previas
        .filter((item) => !internosYaPedidos.has(item.interno))
        .map((item) => hydratePrevia(item, unidadesMap.get(item.interno)))
        .sort(comparePrevia);

      return res.status(200).json({ data });
    } catch (error) {
      logError("PedidoUnidadController.listPrevias");
      console.error(error);
      return res.status(500).json({ message: "Error al listar la lista previa de pedidos" });
    }
  };

  static createPrevia = async (req: Request, res: Response) => {
    const interno = Number(req.body?.interno);

    if (!req.user?._id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!Number.isInteger(interno) || interno <= 0) {
      return res.status(400).json({ error: "El interno ingresado no es valido" });
    }

    try {
      const internosYaPedidos = await getInternosYaPedidosSet([interno]);
      if (internosYaPedidos.has(interno)) {
        return res.status(409).json({ error: "Esta unidad ya fue pedida" });
      }

      const exists = await PedidoUnidadPrevia.exists({ interno });
      if (exists) {
        return res.status(409).json({ error: "Ese interno ya existe en la lista previa" });
      }

      const unidad = (await getInfoInternosMap([interno])).get(interno);
      if (!unidad) {
        return res.status(404).json({ error: "No se encontro informacion para el interno solicitado" });
      }

      const previa = await PedidoUnidadPrevia.create({
        interno: unidad.interno,
        prioridad: "normal",
        usuario_id: new mongoose.Types.ObjectId(req.user._id),
        usuario: `${req.user.lastName}, ${req.user.name}`,
      });

      return res.status(201).json({
        message: "Unidad agregada a la lista previa",
        data: hydratePrevia(previa.toObject(), unidad),
      });
    } catch (error: any) {
      logError("PedidoUnidadController.createPrevia");
      console.error(error);

      if (error?.code === 11000) {
        return res.status(409).json({ error: "Ese interno ya existe en la lista previa" });
      }

      return res.status(400).json({
        error: error instanceof Error ? error.message : "No se pudo crear el registro previo",
      });
    }
  };

  static updatePrioridadPrevia = async (req: Request, res: Response) => {
    const { prioridad } = req.body as { prioridad?: unknown };

    if (!isValidPrioridad(prioridad)) {
      return res.status(400).json({ error: "La prioridad ingresada no es valida" });
    }

    try {
      const registroPrevio = await PedidoUnidadPrevia.findById(req.params.id).lean();

      if (!registroPrevio) {
        return res.status(404).json({ error: "Registro previo no encontrado" });
      }

      const internosYaPedidos = await getInternosYaPedidosSet([registroPrevio.interno]);
      if (internosYaPedidos.has(registroPrevio.interno)) {
        return res.status(409).json({ error: "Esta unidad ya fue pedida" });
      }

      const data = await PedidoUnidadPrevia.findByIdAndUpdate(
        req.params.id,
        { prioridad },
        { new: true, lean: true },
      );

      if (!data) {
        return res.status(404).json({ error: "Registro previo no encontrado" });
      }

      const unidadActual = (await getInfoInternosMap([data.interno])).get(data.interno);

      return res.status(200).json({
        message: "Prioridad actualizada correctamente",
        data: hydratePrevia(data, unidadActual),
      });
    } catch (error) {
      logError("PedidoUnidadController.updatePrioridadPrevia");
      console.error(error);
      return res.status(400).json({ error: "No se pudo actualizar la prioridad" });
    }
  };

  static deletePrevia = async (req: Request, res: Response) => {
    try {
      const registroPrevio = await PedidoUnidadPrevia.findById(req.params.id).lean();

      if (!registroPrevio) {
        return res.status(404).json({ error: "Registro previo no encontrado" });
      }

      const internosYaPedidos = await getInternosYaPedidosSet([registroPrevio.interno]);
      if (internosYaPedidos.has(registroPrevio.interno)) {
        return res.status(409).json({ error: "No se puede eliminar una unidad que ya fue pedida" });
      }

      const data = await PedidoUnidadPrevia.findByIdAndDelete(req.params.id);

      if (!data) {
        return res.status(404).json({ error: "Registro previo no encontrado" });
      }

      return res.status(200).json({
        message: "Registro previo eliminado correctamente",
      });
    } catch (error) {
      logError("PedidoUnidadController.deletePrevia");
      console.error(error);
      return res.status(400).json({ error: "No se pudo eliminar el registro previo" });
    }
  };

  static list = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
      const skip = (page - 1) * limit;

      const [fechasAgrupadas, totalPorFechaResult, totalRecords] = await Promise.all([
        PedidoUnidad.aggregate<{ _id: string }>([
          { $group: { _id: "$fecha" } },
          { $sort: { _id: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]),
        PedidoUnidad.aggregate<{ total: number }>([
          { $group: { _id: "$fecha" } },
          { $count: "total" },
        ]),
        PedidoUnidad.countDocuments(),
      ]);
      const fechasPagina = fechasAgrupadas.map((item) => item._id);
      const data = fechasPagina.length
        ? await PedidoUnidad.find({ fecha: { $in: fechasPagina } })
            .sort({ fecha: -1, createdAt: -1 })
            .lean()
        : [];
      const total = totalPorFechaResult[0]?.total ?? 0;

      return res.status(200).json({
        data: data.map(normalizePedidoUnidad),
        pagination: {
          page,
          limit,
          total,
          totalRecords,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      });
    } catch (error) {
      logError("PedidoUnidadController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar pedidos de unidades" });
    }
  };

  static listRegistros = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const skip = (page - 1) * limit;
      const interno = typeof req.query.interno === "string" ? req.query.interno.trim() : "";

      const pipeline: any[] = [
        { $unwind: "$items" },
      ];

      if (interno) {
        pipeline.push(
          { $addFields: { internoBusqueda: { $toString: "$items.interno" } } },
          { $match: { internoBusqueda: { $regex: escapeRegex(interno), $options: "i" } } },
        );
      }

      pipeline.push(
        { $sort: { fecha: -1, createdAt: -1, "items.interno": 1 } },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 0,
                  pedidoId: "$_id",
                  fecha: 1,
                  usuario_id: 1,
                  usuarioNombre: 1,
                  createdAt: 1,
                  interno: "$items.interno",
                  version: "$items.version",
                  order: "$items.order",
                  cliente: "$items.cliente",
                  vendedor: "$items.vendedor",
                  chasis: "$items.chasis",
                  modelo: "$items.modelo",
                  prioridad: "$items.prioridad",
                  PDI: "$items.PDI",
                  listaPreviaCreatedAt: "$items.listaPreviaCreatedAt",
                  listaPreviaUsuario: "$items.listaPreviaUsuario",
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      );

      const [result] = await PedidoUnidad.aggregate<{
        data: Array<Record<string, unknown>>;
        total: Array<{ count: number }>;
      }>(pipeline);
      const data = result?.data ?? [];
      const total = result?.total?.[0]?.count ?? 0;

      return res.status(200).json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      });
    } catch (error) {
      logError("PedidoUnidadController.listRegistros");
      console.error(error);
      return res.status(500).json({ message: "Error al listar unidades pedidas" });
    }
  };

  static getEstadoInternos = async (req: Request, res: Response) => {
    const internos = Array.isArray(req.body?.internos)
      ? req.body.internos
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isInteger(value) && value > 0)
      : [];

    if (!internos.length) {
      return res.status(200).json({ data: {} });
    }

    try {
      const encontrados = await PedidoUnidad.aggregate([
        { $unwind: "$items" },
        { $match: { "items.interno": { $in: internos } } },
        { $group: { _id: "$items.interno" } },
      ]) as Array<{ _id: number }>;

      const encontradosSet = new Set(encontrados.map((item) => item._id));
      const data = internos.reduce((acc: Record<number, boolean>, interno) => {
        acc[interno] = encontradosSet.has(interno);
        return acc;
      }, {});

      return res.status(200).json({ data });
    } catch (error) {
      logError("PedidoUnidadController.getEstadoInternos");
      console.error(error);
      return res.status(500).json({ message: "Error al consultar el estado de internos pedidos" });
    }
  };

  static getEstadoInternosArribo = async (req: Request, res: Response) => {
    const internos = Array.isArray(req.body?.internos)
      ? req.body.internos
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isInteger(value) && value > 0)
      : [];

    if (!internos.length) {
      return res.status(200).json({ data: {} });
    }

    try {
      const internosQuery = internos.join(", ");
      const query = `
SELECT
  stoauto.sa_codigo AS interno,
  li.li_fecha AS fechaRecepcionRemito
FROM stoauto
INNER JOIN movnped
  ON stoauto.sa_codigo = movnped.mnp_stoauto
LEFT JOIN anexnvo an
  ON an.an_stoauto = stoauto.sa_codigo
LEFT JOIN libivac li
  ON li.li_nroope = an.an_nrooper
WHERE stoauto.sa_codigo IN (${internosQuery})
`;

      const rows = await sequelizeNIC.query<InternoArriboRow>(query, {
        type: QueryTypes.SELECT,
      });

      const recibidosSet = new Set(
        rows
          .filter((row) => Boolean(row.fechaRecepcionRemito))
          .map((row) => Number(row.interno)),
      );

      const data = internos.reduce((acc: Record<number, boolean>, interno) => {
        acc[interno] = recibidosSet.has(interno);
        return acc;
      }, {});

      return res.status(200).json({ data });
    } catch (error) {
      logError("PedidoUnidadController.getEstadoInternosArribo");
      console.error(error);
      return res.status(500).json({ message: "Error al consultar el arribo de internos" });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const data = await PedidoUnidad.findById(req.params.id).lean();

      if (!data) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      return res.status(200).json({ data: normalizePedidoUnidad(data) });
    } catch (error) {
      logError("PedidoUnidadController.getById");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener el pedido de unidades" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const { fecha, items } = req.body as {
      fecha?: string;
      items?: PedidoUnidadPayloadItem[];
    };

    if (!req.user?._id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!isValidFecha(fecha)) {
      return res.status(400).json({ error: "La fecha es obligatoria y debe tener formato YYYY-MM-DD" });
    }

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Debes ingresar al menos una unidad" });
    }

    try {
      const pedidoItems = await buildPedidoItems(items, { userRoles: req.user.role });

      const pedido = await PedidoUnidad.create({
        fecha,
        usuario_id: new mongoose.Types.ObjectId(req.user._id),
        usuarioNombre: `${req.user.lastName}, ${req.user.name}`,
        items: pedidoItems,
      });
      await removePreviasByInternos(pedidoItems.map((item) => item.interno));

      return res.status(201).json({
        message: "Pedido de unidades generado correctamente",
        data: pedido,
      });
    } catch (error) {
      logError("PedidoUnidadController.create");
      console.error(error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "No se pudo generar el pedido de unidades",
      });
    }
  };

  static update = async (req: Request, res: Response) => {
    const { fecha, items } = req.body as {
      fecha?: string;
      items?: PedidoUnidadPayloadItem[];
    };

    if (!isValidFecha(fecha)) {
      return res.status(400).json({ error: "La fecha es obligatoria y debe tener formato YYYY-MM-DD" });
    }

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Debes ingresar al menos una unidad" });
    }

    try {
      const pedido = await PedidoUnidad.findById(req.params.id);

      if (!pedido) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      const pedidoItems = await buildPedidoItems(items, {
        excludePedidoId: String(req.params.id),
        userRoles: req.user?.role,
        existingItems: pedido.items,
      });

      pedido.fecha = fecha;
      pedido.items = pedidoItems;
      await pedido.save();
      await removePreviasByInternos(pedidoItems.map((item) => item.interno));

      return res.status(200).json({
        message: "Pedido de unidades actualizado correctamente",
        data: pedido,
      });
    } catch (error) {
      logError("PedidoUnidadController.update");
      console.error(error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "No se pudo actualizar el pedido de unidades",
      });
    }
  };
}

