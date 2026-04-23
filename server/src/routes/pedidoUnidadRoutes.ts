import { Router } from "express";
import { PedidoUnidadController } from "../controllers/PedidoUnidadController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();

router.use(authenticate);
router.use(authorizeCompanies("convencional"));

router.get("/unidad/:interno", PedidoUnidadController.getInfoInterno);
router.post("/estado-internos", authorizeRoles("admin", "gerente", "stock"), PedidoUnidadController.getEstadoInternos);

router.use(authorizeRoles("admin", "stock"));

router.get("/", PedidoUnidadController.list);
router.get("/:id", PedidoUnidadController.getById);
router.post("/", PedidoUnidadController.create);
router.put("/:id", PedidoUnidadController.update);

export default router;
