import { Router } from "express";
import { PedidoMensualController } from "../controllers/PedidoMensualController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();

router.use(authenticate);
router.use(authorizeCompanies("convencional"));

router.get("/", authorizeRoles("stock", "admin", "gerente"), PedidoMensualController.list);
router.get("/:id", authorizeRoles("stock", "admin", "gerente"), PedidoMensualController.getById);
router.post("/", authorizeRoles("stock", "admin", "gerente"), PedidoMensualController.create);
router.put("/:id", authorizeRoles("stock", "admin", "gerente"), PedidoMensualController.update);
router.delete("/:id", authorizeRoles("stock", "admin", "gerente"), PedidoMensualController.remove);

export default router;
