import { Router } from "express";
import { RendicionGastoController } from "../controllers/RendicionGastoController";
import { authenticate } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);
router.get("/empresas/:cuit", RendicionGastoController.getEmpresaByCuit);
router.post("/empresas", RendicionGastoController.createEmpresa);
router.get("/", RendicionGastoController.list);
router.post("/", RendicionGastoController.create);
router.get("/:id/pdf", RendicionGastoController.exportPdf);
router.get("/:id", RendicionGastoController.getById);
export default router;
