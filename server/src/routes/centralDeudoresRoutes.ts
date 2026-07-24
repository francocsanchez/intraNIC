import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { CentralDeudoresController } from "../controllers/CentralDeudoresController";

const router = Router();

router.use(authenticate);
router.get(
  "/:identificacion",
  authorizeModules("centralDeudores"),
  CentralDeudoresController.getByIdentificacion,
);

export default router;
