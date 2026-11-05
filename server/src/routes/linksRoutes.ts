import { Router } from "express";
import { LinksController } from "../controllers/LinksController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();
router.use(authenticate);
router.use(authorizeModules("links"));

router.get("/", LinksController.list);
router.post("/", LinksController.create);
router.patch("/:id", LinksController.update);
router.delete("/:id", LinksController.remove);

export default router;
