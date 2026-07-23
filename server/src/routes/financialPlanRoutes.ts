import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { FinancialPlanController } from "../controllers/FinancialPlanController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { requireCotizadorManageAccess } from "../middleware/requireCotizadorManageAccess";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
  },
});

const singleFileUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      const message =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "El archivo supera el limite permitido de 10 MB"
          : "No se pudo recibir el archivo seleccionado";

      res.status(400).json({ error: message });
      return;
    }

    next();
  });
};

router.use(authenticate);

router.get("/", authorizeModules("cotizador"), requireCotizadorManageAccess, FinancialPlanController.list);
router.get("/exportar", authorizeModules("cotizador"), requireCotizadorManageAccess, FinancialPlanController.exportExcel);
router.post("/importar", authorizeModules("cotizador"), requireCotizadorManageAccess, singleFileUpload, FinancialPlanController.importExcel);
router.post("/", authorizeModules("cotizador"), requireCotizadorManageAccess, FinancialPlanController.create);
router.put("/:id", authorizeModules("cotizador"), requireCotizadorManageAccess, FinancialPlanController.update);
router.delete("/:id", authorizeModules("cotizador"), requireCotizadorManageAccess, FinancialPlanController.remove);

export default router;
