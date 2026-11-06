import { Router } from "express";
import { LiessReparacionesController } from "../controllers/LiessReparacionesController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();
router.use(authenticate, authorizeModules("liessReparaciones"));
router.get("/talleres", LiessReparacionesController.listarTalleres);
router.post("/talleres", LiessReparacionesController.crearTaller);
router.patch("/talleres/:id", LiessReparacionesController.editarTaller);
router.patch("/talleres/:id/activo", LiessReparacionesController.cambiarTallerActivo);
router.get("/unidades/:interno", LiessReparacionesController.buscarUnidad);
router.get("/presupuestos", LiessReparacionesController.listarPresupuestos);
router.post("/presupuestos", LiessReparacionesController.crearPresupuesto);
router.patch("/presupuestos/:id/gestion", LiessReparacionesController.gestionarPresupuesto);

export default router;
