import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { SegUnidadesFabricaController } from "../controllers/SegUnidadesFabricaController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

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

const authorizeSegUnidadesFabricaImport = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  const normalizedRoles = (req.user.role ?? []).map((role) =>
    String(role)
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase(),
  );

  const canImport = normalizedRoles.includes("superadmin") || normalizedRoles.includes("stock");

  if (!canImport) {
    res.status(403).json({
      error: "Solo usuarios con rol stock o superAdmin pueden importar este archivo",
    });
    return;
  }

  next();
};

router.use(authenticate);
router.use(authorizeModules("segUnidadesFabrica"));

router.get("/", SegUnidadesFabricaController.list);
router.post("/importar", authorizeSegUnidadesFabricaImport, singleFileUpload, SegUnidadesFabricaController.importData);

export default router;
