import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { CalidadVentasController } from "../controllers/CalidadVentasController";

const router = Router();

router.use(authenticate, authorizeModules("calidadVentas"));
router.get("/vendedores", CalidadVentasController.searchVendedores);
router.get("/", CalidadVentasController.list);
router.put("/", CalidadVentasController.save);

export default router;
