import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { VersionPriceMonthlyController } from "../controllers/VersionPriceMonthlyController";
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
router.use(authorizeModules("cotizador"));
router.use(requireCotizadorManageAccess);

router.get("/", VersionPriceMonthlyController.list);
router.get("/exportar", VersionPriceMonthlyController.exportExcel);
router.post("/importar", singleFileUpload, VersionPriceMonthlyController.importExcel);
router.post("/", VersionPriceMonthlyController.create);
router.put("/:id", VersionPriceMonthlyController.update);
router.delete("/:id", VersionPriceMonthlyController.remove);

export default router;
