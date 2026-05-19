import { Router } from "express";
import { FacturaAnticipoController } from "../controllers/FacturaAnticipoController";
import { authenticate } from "../middleware/authenticate";
import { authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("administracion"));

router.get("/", FacturaAnticipoController.list);
router.post("/", FacturaAnticipoController.create);
router.delete("/:id", FacturaAnticipoController.delete);

export default router;
