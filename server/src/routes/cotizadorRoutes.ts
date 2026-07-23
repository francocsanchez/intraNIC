import { Router } from "express";
import { CotizadorController } from "../controllers/CotizadorController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.get("/catalogo", authorizeModules("cotizador"), CotizadorController.catalogo);

export default router;
