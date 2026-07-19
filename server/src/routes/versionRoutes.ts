import { Router } from "express";
import { VersionController } from "../controllers/VersionController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.get(
  "/",
  authorizeModules("configuracion", "proformas", "pedidoMensual", "preventas", "testDrive"),
  VersionController.list,
);
router.post(
  "/",
  authorizeModules("configuracion"),
  VersionController.create,
);
router.put(
  "/:id",
  authorizeModules("configuracion"),
  VersionController.update,
);
router.delete(
  "/:id",
  authorizeModules("configuracion"),
  VersionController.remove,
);

export default router;
