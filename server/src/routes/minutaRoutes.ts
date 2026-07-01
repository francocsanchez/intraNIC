import { Router } from "express";
import { MinutaController } from "../controllers/MinutaController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("minutas"));

router.get(
  "/participants",
  authorizeRoleAccess("comercial.minutas.read"),
  MinutaController.listParticipants,
);
router.get("/", authorizeRoleAccess("comercial.minutas.read"), MinutaController.list);
router.get("/:id", authorizeRoleAccess("comercial.minutas.read"), MinutaController.getById);
router.get("/:id/pdf", authorizeRoleAccess("comercial.minutas.pdf"), MinutaController.exportPdf);
router.post("/:id/send", authorizeRoleAccess("comercial.minutas.pdf"), MinutaController.sendByEmail);
router.post("/", authorizeRoleAccess("comercial.minutas.create"), MinutaController.create);
router.put("/:id", authorizeRoleAccess("comercial.minutas.update"), MinutaController.update);
router.delete("/:id", authorizeRoleAccess("comercial.minutas.delete"), MinutaController.remove);

export default router;
