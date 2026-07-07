import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { CallCenterController } from "../controllers/CallCenterController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

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
router.use(authorizeModules("callCenter"));

router.post("/importar", singleFileUpload, CallCenterController.importData);
router.get("/origenes", CallCenterController.listDataOrigins);
router.patch("/origenes/:id", CallCenterController.updateDataOrigin);
router.get("/origenes-resumidos", CallCenterController.listSummaryOrigins);
router.post("/origenes-resumidos", CallCenterController.createSummaryOrigin);
router.put("/origenes-resumidos/:id", CallCenterController.updateSummaryOrigin);
router.patch("/origenes-resumidos/:id/change-status", CallCenterController.changeSummaryOriginStatus);

export default router;
