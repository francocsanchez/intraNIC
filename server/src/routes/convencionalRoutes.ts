import { Router } from "express";
import { ConvencionalController } from "../controllers/ConvencionalController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar stock de reventa.
 *
 */
router.get("/stock-reventa", ConvencionalController.stockReventa);

router.use(authenticate);

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible", authorizeModules("convencional"), ConvencionalController.stockDisponible);

/**
 *
 * @route GET /
 * @desc Listar stock guardado.
 *
 */
router.get("/stock-guardado", authorizeModules("convencional"), ConvencionalController.stockGuardado);

/**
 *
 * @route GET /
 * @desc Listar stock reservado.
 *
 */
router.get("/stock-reservado", authorizeModules("convencional"), ConvencionalController.stockReservado);

/**
 *
 * @route GET /
 * @desc Mis reservas.
 *
 */
router.get(
  "/stock-reservado/:numeroVendedor",
  authorizeModules("convencional"),
  ConvencionalController.misReservas,
);

/**
 *
 * @route GET /
 * @desc Mi lista de espera.
 *
 */
router.get("/mi-lista-de-espera", authorizeModules("convencional"), ConvencionalController.miListaDeEspera);

/**
 *
 * @route GET /
 * @desc Lista de espera.
 *
 */
router.get("/lista-de-espera", ConvencionalController.listaDeEspera);

/**
 *
 * @route GET /
 * @desc Mi lista de espera.
 *
 */
router.get("/mis-reservas", authorizeModules("convencional"), ConvencionalController.misReservas);

router.get("/mis-operaciones/:mes/:ano", authorizeModules("convencional"), ConvencionalController.misOperaciones);
router.get("/promedio-operaciones/:mes/:ano", authorizeModules("promedio"), ConvencionalController.promedioOperaciones);
router.get("/ranking-operaciones/:ano", authorizeModules("ranking"), ConvencionalController.rankingOperaciones);
export default router;
