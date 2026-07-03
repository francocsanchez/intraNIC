import { Router } from "express";
import { DmsController } from "../controllers/DmsController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();
router.use(authenticate);
/**
 *
 * @route GET /
 * @desc Listar vendedores.
 *
 */
router.get("/vendedores", authorizeModules("usuarios", "configuracion"), DmsController.getVendedores);

/**
 *
 * @route GET /
 * @desc Listar vendedores activos.
 *
 */
router.get("/vendedores/activos", authorizeModules("configuracion", "preventas"), authorizeRoleAccess("preventas.create"), DmsController.getVendedoresActivos);

/**
 *
 * @route GET /
 * @desc Listar asignacion por mes y anio.
 *
 */
router.get("/asignaciones/:mes/:anio", authorizeModules("asignaciones"), authorizeRoleAccess("convencional.asignaciones"), DmsController.getAsignacion);

router.get(
  "/analisis-stock",
  authorizeModules("analisisStock"),
  authorizeRoleAccess("convencional.analisisStock"),
  DmsController.getAnalisisStock,
);
router.get(
  "/analisis-stock/versiones-disponibles",
  authorizeModules("analisisStock"),
  authorizeRoleAccess("convencional.analisisStock"),
  DmsController.getAnalisisStockVersionesDisponibles,
);
router.post(
  "/analisis-stock/ped",
  authorizeModules("analisisStock"),
  authorizeRoleAccess("convencional.analisisStock"),
  DmsController.saveAnalisisStockPed,
);
router.get(
  "/analisis-stock/diccionario-versiones",
  authorizeModules("analisisStock"),
  authorizeRoleAccess("convencional.analisisStock"),
  DmsController.listAnalisisStockVersionDictionary,
);
router.post(
  "/analisis-stock/diccionario-versiones",
  authorizeModules("analisisStock"),
  authorizeRoleAccess("convencional.analisisStock"),
  DmsController.createAnalisisStockVersionDictionary,
);
router.put(
  "/analisis-stock/diccionario-versiones/:id",
  authorizeModules("analisisStock"),
  authorizeRoleAccess("convencional.analisisStock"),
  DmsController.updateAnalisisStockVersionDictionary,
);
router.delete(
  "/analisis-stock/diccionario-versiones/:id",
  authorizeModules("analisisStock"),
  authorizeRoleAccess("convencional.analisisStock"),
  DmsController.deleteAnalisisStockVersionDictionary,
);

/**
 *
 * @route GET /
 * @desc Listar asignacion por mes y anio.
 *
 */
router.get("/consolidado/stock", authorizeModules("convencional"), authorizeRoleAccess("convencional.stockDisponible"), DmsController.getStockConsolidado);

/**
 *
 * @route GET /
 * @desc Listar asignacion por mes y anio.
 *
 */
router.get("/reventas/facturas", authorizeModules("reventaPendientes"), authorizeRoleAccess("administracion.reventaPendientes"), DmsController.getFactuasReventas);

export default router;
