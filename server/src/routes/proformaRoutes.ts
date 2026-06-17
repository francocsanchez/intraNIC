import { Router } from "express";
import { ProformaController } from "../controllers/ProformaController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("proformas"));

router.get("/", ProformaController.list);
router.get("/:id", ProformaController.getById);
router.get("/:id/pdf", ProformaController.exportPdf);
router.post("/", ProformaController.create);

export default router;
