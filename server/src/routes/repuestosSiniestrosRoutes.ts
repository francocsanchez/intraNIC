import { Router } from "express";
import { RepuestosSiniestrosController } from "../controllers/RepuestosSiniestrosController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();
router.use(authenticate);
router.use(authorizeModules("repuestosSiniestros"));
router.get("/unidad/:interno", RepuestosSiniestrosController.unidad);
router.get("/notas-pedido", RepuestosSiniestrosController.notasPedido);
router.get("/notas-pedido/:mscNroope", RepuestosSiniestrosController.notaPedido);
router.get("/", RepuestosSiniestrosController.list);
router.post("/", authorizeRoles("repuestos"), RepuestosSiniestrosController.create);
router.put("/:id", authorizeRoles("repuestos"), RepuestosSiniestrosController.update);
router.patch("/:id/articulos/:renglon/estado", authorizeRoles("repuestos"), RepuestosSiniestrosController.updateEstadoArticulo);
router.delete("/:id", authorizeRoles("repuestos"), RepuestosSiniestrosController.remove);
export default router;
