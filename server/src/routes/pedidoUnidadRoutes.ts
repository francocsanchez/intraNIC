import { Router } from "express";
import { PedidoUnidadController } from "../controllers/PedidoUnidadController";
import { authenticate } from "../middleware/authenticate";
import { authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();
const listaPreviaRoles = ["stock", "admin", "administracion", "gerente"];
const crearPreviaRoles = ["stock", "admin", "administracion"];
const pedidoRoles = ["stock", "admin"];
const lecturaPedidoRoles = ["stock", "admin", "administracion", "gerente"];
const estadoInternosRoles = ["stock", "admin", "gerente", "administracion"];
const prioridadRoles = ["stock", "admin", "administracion", "gerente"];

router.use(authenticate);

router.get("/unidad/:interno", authorizeRoles(...pedidoRoles), PedidoUnidadController.getInfoInterno);
router.post("/estado-internos", authorizeRoles(...estadoInternosRoles), PedidoUnidadController.getEstadoInternos);
router.post("/estado-internos-arribo", authorizeRoles(...estadoInternosRoles), PedidoUnidadController.getEstadoInternosArribo);

router.get("/previas", authorizeRoles(...listaPreviaRoles), PedidoUnidadController.listPrevias);
router.post("/previas", authorizeRoles(...crearPreviaRoles), PedidoUnidadController.createPrevia);
router.patch("/previas/:id/prioridad", authorizeRoles(...prioridadRoles), PedidoUnidadController.updatePrioridadPrevia);
router.delete("/previas/:id", authorizeRoles(...listaPreviaRoles), PedidoUnidadController.deletePrevia);

router.get("/registros", authorizeRoles(...lecturaPedidoRoles), PedidoUnidadController.listRegistros);
router.get("/", authorizeRoles(...lecturaPedidoRoles), PedidoUnidadController.list);
router.get("/:id", authorizeRoles(...lecturaPedidoRoles), PedidoUnidadController.getById);
router.post("/", authorizeRoles(...pedidoRoles), PedidoUnidadController.create);
router.put("/:id", authorizeRoles(...pedidoRoles), PedidoUnidadController.update);

export default router;

