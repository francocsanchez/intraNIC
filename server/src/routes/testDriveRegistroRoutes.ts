import { Router } from "express";
import { TestDriveRegistroController } from "../controllers/TestDriveRegistroController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeAnyRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("registroTestDrive", "registroTestDriveConvencional"));

router.get(
  "/",
  authorizeAnyRoleAccess(
    "comercial.testDriveRegistroConvencional.read",
    "planAhorro.testDriveRegistro.read",
  ),
  TestDriveRegistroController.list,
);

router.post(
  "/",
  authorizeAnyRoleAccess(
    "comercial.testDriveRegistroConvencional.create",
    "planAhorro.testDriveRegistro.create",
  ),
  TestDriveRegistroController.create,
);

router.put(
  "/:id",
  authorizeAnyRoleAccess(
    "comercial.testDriveRegistroConvencional.updateOwn",
    "planAhorro.testDriveRegistro.updateOwn",
  ),
  TestDriveRegistroController.update,
);

router.delete(
  "/:id",
  authorizeAnyRoleAccess(
    "comercial.testDriveRegistroConvencional.deleteOwn",
    "comercial.testDriveRegistroConvencional.deleteManaged",
    "planAhorro.testDriveRegistro.deleteOwn",
    "planAhorro.testDriveRegistro.deleteManaged",
  ),
  TestDriveRegistroController.remove,
);

export default router;
