import { Router } from "express";
import { PatentamientosDashboardController } from "../controllers/PatentamientosDashboardController";
import { UnidadesDealersController } from "../controllers/UnidadesDealersController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("patentamientos"));
router.use(authorizeRoleAccess("analisis.patentamientos"));

router.get("/dashboard/years", PatentamientosDashboardController.getAvailableYears);
router.get("/dashboard/top-marcas/pais", PatentamientosDashboardController.getTopMarcasPais);
router.get("/dashboard/top-marcas/zona-nic", PatentamientosDashboardController.getTopMarcasZonaNic);
router.get("/dashboard/segmento-pickup/pais", PatentamientosDashboardController.getSegmentoPickupPais);
router.get("/dashboard/segmento-pickup/zona-nic", PatentamientosDashboardController.getSegmentoPickupZonaNic);
router.get("/dashboard/segmento-sw4/pais", PatentamientosDashboardController.getSegmentoSw4Pais);
router.get("/dashboard/segmento-sw4/zona-nic", PatentamientosDashboardController.getSegmentoSw4ZonaNic);
router.get("/dashboard/segmento-c-cross/pais", PatentamientosDashboardController.getSegmentoCCrossPais);
router.get("/dashboard/segmento-c-cross/zona-nic", PatentamientosDashboardController.getSegmentoCCrossZonaNic);
router.get("/dashboard/segmento-yaris/pais", PatentamientosDashboardController.getSegmentoYarisPais);
router.get("/dashboard/segmento-yaris/zona-nic", PatentamientosDashboardController.getSegmentoYarisZonaNic);
router.get("/dashboard/segmento-y-cross/pais", PatentamientosDashboardController.getSegmentoYCrossPais);
router.get("/dashboard/segmento-y-cross/zona-nic", PatentamientosDashboardController.getSegmentoYCrossZonaNic);
router.get("/dashboard/toyota-evolucion", PatentamientosDashboardController.getToyotaEvolution);
router.get("/dashboard/general/zona-nic", PatentamientosDashboardController.getGeneralZonaNic);
router.post("/unidades-dealers/sincronizar", UnidadesDealersController.sincronizar);
router.get("/unidades-dealers/resumen", UnidadesDealersController.getResumen);
router.get("/unidades-dealers/treemap", UnidadesDealersController.getTreemap);

export default router;
