import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoles } from "../middleware/authorizeRoles";
import { SsiVentasController } from "../controllers/SsiVentasController";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 20 * 1024 * 1024,
  },
});

const singleFileUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      const message =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "El archivo supera el limite permitido de 20 MB"
          : "No se pudo recibir el archivo seleccionado";

      res.status(400).json({ error: message });
      return;
    }

    next();
  });
};

router.use(authenticate);

router.get("/hot-alert-config", authorizeModules("configuracion"), SsiVentasController.getHotAlertConfig);
router.put("/hot-alert-config", authorizeModules("configuracion"), SsiVentasController.updateHotAlertConfig);

router.use(authorizeModules("ssiVentas"));

router.get("/administrativas", SsiVentasController.listAdministrativas);
router.post("/import", authorizeRoles("ssi"), singleFileUpload, SsiVentasController.importCsv);
router.get("/", SsiVentasController.list);
router.get("/:operacion", SsiVentasController.getByOperacion);
router.patch("/:operacion/administrativa", authorizeRoles("administracion"), SsiVentasController.updateAdministrativa);
router.post("/:operacion/no-atendio", authorizeRoles("ssi"), SsiVentasController.registerNoAnswer);
router.post("/:operacion/encuesta", authorizeRoles("ssi"), SsiVentasController.registerSurvey);

export default router;
