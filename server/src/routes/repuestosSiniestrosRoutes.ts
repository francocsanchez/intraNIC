import { Router } from "express";
import { RepuestosSiniestrosController } from "../controllers/RepuestosSiniestrosController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();
router.use(authenticate);
router.use(authorizeModules("repuestosSiniestros"));
router.get("/unidad/:interno", RepuestosSiniestrosController.unidad);
router.get("/notas-pedido", RepuestosSiniestrosController.notasPedido);
router.get("/notas-pedido/:mscNroope", RepuestosSiniestrosController.notaPedido);
router.get("/", RepuestosSiniestrosController.list);
router.post("/", RepuestosSiniestrosController.create);
router.put("/:id", RepuestosSiniestrosController.update);
router.patch("/:id/articulos/:renglon/estado", RepuestosSiniestrosController.updateEstadoArticulo);
router.delete("/:id", RepuestosSiniestrosController.remove);
export default router;
