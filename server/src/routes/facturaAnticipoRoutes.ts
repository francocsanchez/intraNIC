import { Router } from "express";
import { FacturaAnticipoController } from "../controllers/FacturaAnticipoController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("facturasAnticipo"));

router.get("/", FacturaAnticipoController.list);
router.post("/", FacturaAnticipoController.create);
router.delete("/:id", FacturaAnticipoController.delete);

export default router;
