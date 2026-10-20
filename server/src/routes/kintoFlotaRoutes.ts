import { Router } from "express";
import { KintoFlotaController } from "../controllers/KintoFlotaController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();
router.use(authenticate);
router.use(authorizeModules("kintoFlota"));
router.get("/", KintoFlotaController.list);
router.get("/buscar", KintoFlotaController.lookup);
router.get("/sucursales", KintoFlotaController.listSucursales);
router.post("/", KintoFlotaController.create);
router.patch("/:id/sucursal", KintoFlotaController.updateSucursal);
router.patch("/:id/km", KintoFlotaController.updateKm);
router.patch("/:id/desactivar", KintoFlotaController.deactivate);
router.patch("/:id/reactivar", KintoFlotaController.reactivate);
router.patch("/:id/geotab", KintoFlotaController.updateGeotab);

export default router;
