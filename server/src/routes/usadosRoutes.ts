import { Router } from "express";
import { ConvencionalController } from "../controllers/ConvencionalController";
import { authenticate } from "../middleware/authenticate";
import { authorizeRoles } from "../middleware/authorizeRoles";
import { UsadosController } from "../controllers/UsadosController";

const router = Router();
router.use(authenticate);
/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible", authorizeRoles("admin", "supervisor", "gerente", "vendedor"), UsadosController.stockDisponible);

/**
 *
 * @route GET /
 * @desc Listar stock guardado.
 *
 */
router.get("/stock-guardado", authorizeRoles("admin", "gerente"), UsadosController.stockGuardado);

/**
 *
 * @route GET /
 * @desc Listar stock reservado.
 *
 */
router.get("/stock-reservado", authorizeRoles("admin", "supervisor", "gerente"), UsadosController.stockReservado);

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

export default router;
