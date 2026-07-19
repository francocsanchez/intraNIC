import { Router } from "express";
import { ColorController } from "../controllers/ColorController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.get(
  "/",
  authorizeModules("configuracion", "preventas", "testDrive"),
  ColorController.list,
);
router.post("/", ColorController.create);
router.put("/:id", ColorController.update);
router.delete("/:id", ColorController.remove);

export default router;
