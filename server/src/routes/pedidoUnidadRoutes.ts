import { Router } from "express";
import { PedidoUnidadController } from "../controllers/PedidoUnidadController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import {
  authorizeAnyRoleAccess,
  authorizeRoleAccess,
} from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);

router.get("/unidad/:interno", authorizeModules("pedidoUnidades"), authorizeRoleAccess("convencional.pedidoUnidades"), PedidoUnidadController.getInfoInterno);
router.post(
  "/estado-internos",
  authorizeModules("pedidoUnidades", "asignaciones"),
  authorizeAnyRoleAccess("convencional.pedidoUnidades", "convencional.asignaciones"),
  PedidoUnidadController.getEstadoInternos,
);
router.post(
  "/estado-internos-arribo",
  authorizeModules("pedidoUnidades", "listaPrevia"),
  authorizeAnyRoleAccess(
    "convencional.pedidoUnidades",
    "administracion.listaPrevia",
    "administracion.pedidoUnidadesRegistros",
  ),
  PedidoUnidadController.getEstadoInternosArribo,
);

router.get("/previas", authorizeModules("listaPrevia"), authorizeRoleAccess("administracion.listaPrevia"), PedidoUnidadController.listPrevias);
router.post("/previas", authorizeModules("listaPrevia"), authorizeRoleAccess("administracion.listaPrevia"), PedidoUnidadController.createPrevia);
router.patch("/previas/:id/prioridad", authorizeModules("listaPrevia"), authorizeRoleAccess("administracion.listaPrevia"), PedidoUnidadController.updatePrioridadPrevia);
router.delete("/previas/:id", authorizeModules("listaPrevia"), authorizeRoleAccess("administracion.listaPrevia"), PedidoUnidadController.deletePrevia);

router.get(
  "/registros",
  authorizeModules("pedidoUnidades", "listaPrevia"),
  authorizeAnyRoleAccess(
    "convencional.pedidoUnidades",
    "administracion.listaPrevia",
    "administracion.pedidoUnidadesRegistros",
  ),
  PedidoUnidadController.listRegistros,
);
router.get("/", authorizeModules("pedidoUnidades"), authorizeRoleAccess("convencional.pedidoUnidades"), PedidoUnidadController.list);
router.get("/:id", authorizeModules("pedidoUnidades"), authorizeRoleAccess("convencional.pedidoUnidades"), PedidoUnidadController.getById);
router.post("/", authorizeModules("pedidoUnidades"), authorizeRoleAccess("convencional.pedidoUnidades"), PedidoUnidadController.create);
router.put("/:id", authorizeModules("pedidoUnidades"), authorizeRoleAccess("convencional.pedidoUnidades"), PedidoUnidadController.update);

export default router;

