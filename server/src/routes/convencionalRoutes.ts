import { Router } from "express";
import { ConvencionalController } from "../controllers/ConvencionalController";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get(
  "/stock-disponible",
  ConvencionalController.stockDisponible,
);

/**
 *
 * @route GET /
 * @desc Listar stock guardado.
 *
 */
router.get(
  "/stock-guardado",
  ConvencionalController.stockGuardado,
);

/**
 *
 * @route GET /
 * @desc Listar stock reservado.
 *
 */
router.get(
  "/stock-reservado",
  ConvencionalController.stockReservado,
);

/**
 *
 * @route GET /
 * @desc Mis reservas.
 *
 */
router.get(
  "/stock-reservado/:numeroVendedor",
  ConvencionalController.misReservas,
);

/**
 *
 * @route GET /
 * @desc Mi lista de espera.
 *
 */
router.get(
  "/lista-de-espera/:numeroVendedor",
  ConvencionalController.miListaDeEspera,
);

/**
 *
 * @route GET /
 * @desc Lista de espera.
 *
 */
router.get(
  "/lista-de-espera",
  ConvencionalController.listaDeEspera,
);

export default router;
