import { Router } from "express";
import { ConvencionalController } from "../controllers/ConvencionalController";
import { DmsController } from "../controllers/DmsController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();
/**
 *
 * @route GET /
 * @desc Listar stock de reventa.
 *
 */
router.get("/stock-reventa", ConvencionalController.stockReventa);

router.use(authenticate);
router.use(authorizeCompanies("convencional"));

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible", authorizeRoles("admin", "supervisor", "gerente", "vendedor", "stock"), ConvencionalController.stockDisponible);

/**
 *
 * @route GET /
 * @desc Listar stock guardado.
 *
 */
router.get("/stock-guardado", authorizeRoles("admin", "gerente", "stock"), ConvencionalController.stockGuardado);

/**
 *
 * @route GET /
 * @desc Listar stock reservado.
 *
 */
router.get("/stock-reservado", authorizeRoles("admin", "supervisor", "gerente", "stock"), ConvencionalController.stockReservado);

/**
 *
 * @route GET /
 * @desc Mis reservas.
 *
 */
router.get("/stock-reservado/:numeroVendedor", ConvencionalController.misReservas);

/**
 *
 * @route GET /
 * @desc Mi lista de espera.
 *
 */
router.get("/mi-lista-de-espera", authenticate, ConvencionalController.miListaDeEspera);

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
router.get("/mis-reservas", authenticate, ConvencionalController.misReservas);

router.get("/mis-operaciones/:mes/:ano", authenticate, ConvencionalController.misOperaciones);
router.get("/promedio-operaciones/:mes/:ano", authorizeRoles("admin", "supervisor", "gerente"), ConvencionalController.promedioOperaciones);
router.get("/ranking-operaciones/:ano", authorizeRoles("admin", "supervisor", "gerente", "vendedor", "stock"), ConvencionalController.rankingOperaciones);
router.get("/tracking-operaciones/:mes/:ano", authorizeRoles("admin", "supervisor", "gerente", "stock"), DmsController.getTrackingOperaciones);

export default router;
