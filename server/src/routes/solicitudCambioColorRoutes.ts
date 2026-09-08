import { Router } from "express";
import { SolicitudCambioColorController } from "../controllers/SolicitudCambioColorController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();
router.use(authenticate);
router.use(authorizeModules("solicitudCambioColor"));
router.get("/", SolicitudCambioColorController.list);
router.get("/vendedores", SolicitudCambioColorController.vendedores);
router.get("/unidad/:interno", SolicitudCambioColorController.unidad);
router.post("/", SolicitudCambioColorController.create);
router.put("/:id", SolicitudCambioColorController.update);
router.patch("/:id/estado", SolicitudCambioColorController.updateEstado);
router.patch("/:id/rechazar", SolicitudCambioColorController.reject);
export default router;
