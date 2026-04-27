import { Router } from "express";
import { ColorController } from "../controllers/ColorController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();

router.use(authenticate);
router.use(authorizeCompanies("convencional"));

router.get("/", authorizeRoles("admin", "stock", "supervisor"), ColorController.list);
router.use(authorizeRoles("admin", "stock"));
router.post("/", ColorController.create);
router.put("/:id", ColorController.update);
router.delete("/:id", ColorController.remove);

export default router;
