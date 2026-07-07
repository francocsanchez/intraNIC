import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { TestDriveController } from "../controllers/TestDriveController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeAnyRoleAccess, authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

const authorizeTestDriveOptions = (req: Request, res: Response, next: NextFunction) => {
  const negocio = typeof req.query.negocio === "string" ? req.query.negocio.trim() : "";

  if (negocio === "planAhorro") {
    return next();
  }

  return authorizeAnyRoleAccess(
    "sistema.testDrive",
    "comercial.testDriveRegistroConvencional.read",
    "comercial.testDriveRegistroConvencional.create",
    "planAhorro.testDriveRegistro.read",
    "planAhorro.testDriveRegistro.create",
  )(req, res, next);
};

router.use(authenticate);

router.get(
  "/opciones",
  authorizeModules("testDrive", "registroTestDrive", "registroTestDriveConvencional"),
  authorizeTestDriveOptions,
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
