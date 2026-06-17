import { Router } from "express";
import { PedidoMensualController } from "../controllers/PedidoMensualController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("pedidoMensual"));
router.use(authorizeRoleAccess("convencional.pedidoMensual"));

router.get("/", PedidoMensualController.list);
router.get("/:id", PedidoMensualController.getById);
router.post("/", PedidoMensualController.create);
router.put("/:id", PedidoMensualController.update);
router.delete("/:id", PedidoMensualController.remove);

export default router;
