import { Router } from "express";
import { PedidoMensualController } from "../controllers/PedidoMensualController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();

router.use(authenticate);
router.use(authorizeCompanies("convencional"));

router.get("/", authorizeRoles("stock", "admin"), PedidoMensualController.list);
router.get("/:id", authorizeRoles("stock", "admin"), PedidoMensualController.getById);
router.post("/", authorizeRoles("stock", "admin"), PedidoMensualController.create);
router.put("/:id", authorizeRoles("stock", "admin"), PedidoMensualController.update);
router.delete("/:id", authorizeRoles("stock", "admin"), PedidoMensualController.remove);

export default router;
