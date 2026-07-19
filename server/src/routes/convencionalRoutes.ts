import { Router } from "express";
import { ConvencionalController } from "../controllers/ConvencionalController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible", authorizeModules("convencional"), authorizeRoleAccess("convencional.stockDisponible"), ConvencionalController.stockDisponible);

/**
 *
 * @route GET /
 * @desc Listar stock guardado.
 *
 */
router.get("/stock-guardado", authorizeModules("convencional"), authorizeRoleAccess("convencional.stockGuardado"), ConvencionalController.stockGuardado);

/**
 *
 * @route GET /
 * @desc Listar stock reservado.
 *
 */
router.get("/stock-reservado", authorizeModules("convencional"), authorizeRoleAccess("convencional.stockReservado"), ConvencionalController.stockReservado);

/**
 *
 * @route GET /
 * @desc Mis reservas.
 *
 */
router.get(
  "/stock-reservado/:numeroVendedor",
  authorizeModules("convencional"),
  authorizeRoleAccess("convencional.misReservas"),
  ConvencionalController.misReservas,
);

/**
 *
 * @route GET /
 * @desc Mi lista de espera.
 *
 */
router.get("/mi-lista-de-espera", authorizeModules("convencional"), authorizeRoleAccess("convencional.miListaEspera"), ConvencionalController.miListaDeEspera);

/**
 *
 * @route GET /
 * @desc Lista de espera.
 *
 */
router.get("/lista-de-espera", authorizeModules("convencional"), authorizeRoleAccess("convencional.listaEsperaGeneral"), ConvencionalController.listaDeEspera);

/**
 *
 * @route GET /
 * @desc Mi lista de espera.
 *
 */
router.get("/mis-reservas", authorizeModules("convencional"), authorizeRoleAccess("convencional.misReservas"), ConvencionalController.misReservas);

router.get("/mis-operaciones/:mes/:ano", authorizeModules("convencional"), authorizeRoleAccess("convencional.misOperaciones"), ConvencionalController.misOperaciones);
router.get("/promedio-operaciones/:mes/:ano", authorizeModules("promedio"), ConvencionalController.promedioOperaciones);
router.get("/ranking-operaciones/:ano", authorizeModules("ranking"), ConvencionalController.rankingOperaciones);
export default router;
