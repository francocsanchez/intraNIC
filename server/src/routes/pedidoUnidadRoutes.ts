import { Router } from "express";
import { PedidoUnidadController } from "../controllers/PedidoUnidadController";
import { authenticate } from "../middleware/authenticate";
import { authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();
const listaPreviaRoles = ["stock", "admin", "administracion", "gerente"];
const crearPreviaRoles = ["stock", "admin", "administracion"];
const pedidoRoles = ["stock", "admin"];
const estadoInternosRoles = ["stock", "admin", "gerente"];
const prioridadRoles = ["stock", "admin", "administracion", "gerente"];

router.use(authenticate);

router.get("/unidad/:interno", authorizeRoles(...pedidoRoles), PedidoUnidadController.getInfoInterno);
router.post("/estado-internos", authorizeRoles(...estadoInternosRoles), PedidoUnidadController.getEstadoInternos);

router.get("/previas", authorizeRoles(...listaPreviaRoles), PedidoUnidadController.listPrevias);
router.post("/previas", authorizeRoles(...crearPreviaRoles), PedidoUnidadController.createPrevia);
router.patch("/previas/:id/prioridad", authorizeRoles(...prioridadRoles), PedidoUnidadController.updatePrioridadPrevia);
router.delete("/previas/:id", authorizeRoles(...listaPreviaRoles), PedidoUnidadController.deletePrevia);

router.get("/", authorizeRoles(...pedidoRoles), PedidoUnidadController.list);
router.get("/:id", authorizeRoles(...pedidoRoles), PedidoUnidadController.getById);
router.post("/", authorizeRoles(...pedidoRoles), PedidoUnidadController.create);
router.put("/:id", authorizeRoles(...pedidoRoles), PedidoUnidadController.update);

export default router;

