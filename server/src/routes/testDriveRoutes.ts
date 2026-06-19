import { Router } from "express";
import { TestDriveController } from "../controllers/TestDriveController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeAnyRoleAccess, authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);

router.get(
  "/opciones",
  authorizeModules("testDrive", "registroTestDrive", "registroTestDriveConvencional"),
  authorizeAnyRoleAccess(
    "sistema.testDrive",
    "comercial.testDriveRegistroConvencional.read",
    "comercial.testDriveRegistroConvencional.create",
    "planAhorro.testDriveRegistro.read",
    "planAhorro.testDriveRegistro.create",
  ),
  TestDriveController.listActiveOptions,
);

router.get(
  "/",
  authorizeModules("testDrive"),
  authorizeRoleAccess("sistema.testDrive"),
  TestDriveController.list,
);

router.post(
  "/",
  authorizeModules("testDrive"),
  authorizeRoleAccess("sistema.testDrive"),
  TestDriveController.create,
);

router.put(
  "/:id",
  authorizeModules("testDrive"),
  authorizeRoleAccess("sistema.testDrive"),
  TestDriveController.update,
);

router.patch(
  "/:id/change-status",
  authorizeModules("testDrive"),
  authorizeRoleAccess("sistema.testDrive"),
  TestDriveController.changeStatus,
);

export default router;
