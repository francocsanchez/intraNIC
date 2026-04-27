import { Router } from "express";
import { VersionController } from "../controllers/VersionController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();

router.use(authenticate);
router.use(authorizeCompanies("convencional"));
router.use(authorizeRoles("admin", "stock"));

router.get("/", VersionController.list);
router.post("/", VersionController.create);
router.put("/:id", VersionController.update);
router.delete("/:id", VersionController.remove);

export default router;
