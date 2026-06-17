import { Router } from "express";
import { FacturaAnticipoController } from "../controllers/FacturaAnticipoController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("facturasAnticipo"));
router.use(authorizeRoleAccess("administracion.facturasAnticipo"));

router.get("/", FacturaAnticipoController.list);
router.post("/", FacturaAnticipoController.create);
router.delete("/:id", FacturaAnticipoController.delete);

export default router;
