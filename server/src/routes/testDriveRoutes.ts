import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { TestDriveController } from "../controllers/TestDriveController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { hasEnabledModule, sanitizeUserModules } from "../constants/modules";
import { authorizeAnyRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

const authorizeTestDriveOptions = (req: Request, res: Response, next: NextFunction) => {
  const negocio = typeof req.query.negocio === "string" ? req.query.negocio.trim() : "";
  const modules = sanitizeUserModules(req.user?.modules);

  if (hasEnabledModule(modules, ["testDrive"])) {
    return next();
  }

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
  TestDriveController.list,
);

router.post(
  "/",
  authorizeModules("testDrive"),
  TestDriveController.create,
);

router.put(
  "/:id",
  authorizeModules("testDrive"),
  TestDriveController.update,
);

router.patch(
  "/:id/change-status",
  authorizeModules("testDrive"),
  TestDriveController.changeStatus,
);

export default router;
