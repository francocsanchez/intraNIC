import { Router } from "express";
import { RegistroAsignacionController } from "../controllers/RegistroAsignacionController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("registroAsignaciones"));
router.use(authorizeRoleAccess("convencional.registroAsignaciones"));

router.get("/operacion/:operacion", RegistroAsignacionController.getInfoOperacion);
router.get("/resumen", RegistroAsignacionController.summary);
router.get("/", RegistroAsignacionController.list);
router.post("/", RegistroAsignacionController.create);
router.put("/:id", RegistroAsignacionController.update);
router.delete("/:id", RegistroAsignacionController.remove);

export default router;
