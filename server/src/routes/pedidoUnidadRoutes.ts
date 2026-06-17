import { Router } from "express";
import { PedidoUnidadController } from "../controllers/PedidoUnidadController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);

router.get("/unidad/:interno", authorizeModules("pedidoUnidades"), PedidoUnidadController.getInfoInterno);
router.post("/estado-internos", authorizeModules("pedidoUnidades"), PedidoUnidadController.getEstadoInternos);
router.post("/estado-internos-arribo", authorizeModules("pedidoUnidades"), PedidoUnidadController.getEstadoInternosArribo);

router.get("/previas", authorizeModules("listaPrevia"), PedidoUnidadController.listPrevias);
router.post("/previas", authorizeModules("listaPrevia"), PedidoUnidadController.createPrevia);
router.patch("/previas/:id/prioridad", authorizeModules("listaPrevia"), PedidoUnidadController.updatePrioridadPrevia);
router.delete("/previas/:id", authorizeModules("listaPrevia"), PedidoUnidadController.deletePrevia);

router.get("/registros", authorizeModules("pedidoUnidades"), PedidoUnidadController.listRegistros);
router.get("/", authorizeModules("pedidoUnidades"), PedidoUnidadController.list);
router.get("/:id", authorizeModules("pedidoUnidades"), PedidoUnidadController.getById);
router.post("/", authorizeModules("pedidoUnidades"), PedidoUnidadController.create);
router.put("/:id", authorizeModules("pedidoUnidades"), PedidoUnidadController.update);

export default router;

