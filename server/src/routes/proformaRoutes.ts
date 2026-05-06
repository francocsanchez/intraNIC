import { Router } from "express";
import { ProformaController } from "../controllers/ProformaController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();
const lecturaRoles = ["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"];
const gestionRoles = ["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"];

router.use(authenticate);
router.use(authorizeCompanies("convencional"));

router.get("/", authorizeRoles(...lecturaRoles), ProformaController.list);
router.get("/:id", authorizeRoles(...lecturaRoles), ProformaController.getById);
router.get("/:id/pdf", authorizeRoles(...lecturaRoles), ProformaController.exportPdf);
router.post("/", authorizeRoles(...gestionRoles), ProformaController.create);

export default router;
