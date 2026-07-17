import { Router } from "express";
import { MinutaController } from "../controllers/MinutaController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("minutas"));

router.get("/participants", MinutaController.listParticipants);
router.get("/groups", MinutaController.listGroups);
router.post("/groups", MinutaController.createGroup);
router.put("/groups/:id", MinutaController.updateGroup);
router.delete("/groups/:id", MinutaController.removeGroup);
router.get("/", MinutaController.list);
router.get("/:id", MinutaController.getById);
router.get("/:id/pdf", MinutaController.exportPdf);
router.post("/:id/send", MinutaController.sendByEmail);
router.post("/", MinutaController.create);
router.put("/:id", MinutaController.update);
router.delete("/:id", MinutaController.remove);

export default router;
