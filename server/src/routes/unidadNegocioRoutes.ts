import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";
import { UnidadNegocioController } from "../controllers/UnidadNegocioController";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("configuracion"));
router.use(authorizeRoleAccess("sistema.configuracion"));

router.get("/", UnidadNegocioController.list);
router.post("/", UnidadNegocioController.create);
router.put("/:idUnidadNegocio", UnidadNegocioController.update);
router.delete("/:idUnidadNegocio", UnidadNegocioController.remove);

export default router;
