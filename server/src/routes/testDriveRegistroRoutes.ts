import { Router } from "express";
import { TestDriveRegistroController } from "../controllers/TestDriveRegistroController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("registroTestDrive", "registroTestDriveConvencional"));

router.get("/", TestDriveRegistroController.list);

router.post("/", TestDriveRegistroController.create);

router.put("/:id", TestDriveRegistroController.update);

router.delete("/:id", TestDriveRegistroController.remove);

export default router;
