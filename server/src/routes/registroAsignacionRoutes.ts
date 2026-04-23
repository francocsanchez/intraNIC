import { Router } from "express";
import { RegistroAsignacionController } from "../controllers/RegistroAsignacionController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();

router.use(authenticate);
router.use(authorizeCompanies("convencional"));
router.use(authorizeRoles("admin", "stock"));

router.get("/operacion/:operacion", RegistroAsignacionController.getInfoOperacion);
router.get("/resumen", RegistroAsignacionController.summary);
router.get("/", RegistroAsignacionController.list);
router.post("/", RegistroAsignacionController.create);
router.put("/:id", RegistroAsignacionController.update);
router.delete("/:id", RegistroAsignacionController.remove);

export default router;
