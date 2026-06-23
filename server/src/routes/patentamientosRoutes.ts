import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { PatentamientosController } from "../controllers/PatentamientosController";
import { PatentamientosDashboardController } from "../controllers/PatentamientosDashboardController";
import { UnidadesDealersController } from "../controllers/UnidadesDealersController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 50 * 1024 * 1024,
  },
});

const singleFileUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      const message =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "El archivo supera el limite permitido de 50 MB"
          : "No se pudo recibir el archivo seleccionado";

      res.status(400).json({ error: message });
      return;
    }

    next();
  });
};

router.use(authenticate);
router.use(authorizeModules("patentamientos"));
router.use(authorizeRoleAccess("analisis.patentamientos"));

router.post("/importar/pais-marcas", singleFileUpload, PatentamientosController.importPaisMarcas);
router.post("/importar/zona-nic-marcas", singleFileUpload, PatentamientosController.importZonaNicMarcas);
router.post("/importar/pais-modelos", singleFileUpload, PatentamientosController.importPaisModelos);
router.post("/importar/zona-nic-modelos", singleFileUpload, PatentamientosController.importZonaNicModelos);
router.get("/dashboard/years", PatentamientosDashboardController.getAvailableYears);
router.get("/dashboard/top-marcas/pais", PatentamientosDashboardController.getTopMarcasPais);
router.get("/dashboard/top-marcas/zona-nic", PatentamientosDashboardController.getTopMarcasZonaNic);
router.get("/dashboard/segmento-pickup/pais", PatentamientosDashboardController.getSegmentoPickupPais);
router.get("/dashboard/segmento-pickup/zona-nic", PatentamientosDashboardController.getSegmentoPickupZonaNic);
router.get("/dashboard/segmento-suv/pais", PatentamientosDashboardController.getSegmentoSuvPais);
router.get("/dashboard/segmento-suv/zona-nic", PatentamientosDashboardController.getSegmentoSuvZonaNic);
router.get("/dashboard/segmento-b-suv/pais", PatentamientosDashboardController.getSegmentoBSuvPais);
router.get("/dashboard/segmento-b-suv/zona-nic", PatentamientosDashboardController.getSegmentoBSuvZonaNic);
router.get("/dashboard/toyota-evolucion", PatentamientosDashboardController.getToyotaEvolution);
router.get("/dashboard/marcas/evolucion-participacion-pais", PatentamientosDashboardController.getBrandParticipationEvolutionPais);
router.get("/dashboard/general/zona-nic", PatentamientosDashboardController.getGeneralZonaNic);
router.post("/unidades-dealers/sincronizar", UnidadesDealersController.sincronizar);
router.get("/unidades-dealers/resumen", UnidadesDealersController.getResumen);
router.get("/unidades-dealers/treemap", UnidadesDealersController.getTreemap);

export default router;
