import { Router } from "express";
import { VersionController } from "../controllers/VersionController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import {
  authorizeAnyRoleAccess,
  authorizeRoleAccess,
} from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);
router.get(
  "/",
  authorizeModules("configuracion", "proformas", "pedidoMensual", "preventas", "testDrive"),
  authorizeAnyRoleAccess(
    "sistema.configuracion",
    "proformas",
    "convencional.pedidoMensual",
    "preventas.create",
    "sistema.testDrive",
  ),
  VersionController.list,
);
router.post(
  "/",
  authorizeModules("configuracion"),
  authorizeRoleAccess("sistema.configuracion"),
  VersionController.create,
);
router.put(
  "/:id",
  authorizeModules("configuracion"),
  authorizeRoleAccess("sistema.configuracion"),
  VersionController.update,
);
router.delete(
  "/:id",
  authorizeModules("configuracion"),
  authorizeRoleAccess("sistema.configuracion"),
  VersionController.remove,
);

export default router;
