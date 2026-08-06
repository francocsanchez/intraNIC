import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { ConvencionalController } from "../controllers/ConvencionalController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

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

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible", authorizeModules("convencional"), authorizeRoleAccess("convencional.stockDisponible"), ConvencionalController.stockDisponible);

/**
 *
 * @route GET /
 * @desc Listar stock guardado.
 *
 */
router.get("/stock-guardado", authorizeModules("convencional"), authorizeRoleAccess("convencional.stockGuardado"), ConvencionalController.stockGuardado);

/**
 *
 * @route GET /
 * @desc Listar stock reservado.
 *
 */
router.get("/stock-reservado", authorizeModules("convencional"), authorizeRoleAccess("convencional.stockReservado"), ConvencionalController.stockReservado);

router.get("/stock-valorizacion", authorizeModules("valorizacion"), ConvencionalController.stockValorizacion);
router.get("/stock-valorizacion/lista-precios", authorizeModules("valorizacion"), ConvencionalController.stockValorizacionListaPrecios);
router.get("/stock-valorizacion/lista-precios/exportar", authorizeModules("valorizacion"), ConvencionalController.exportStockValorizacionPreciosExcel);
router.post("/stock-valorizacion/lista-precios/importar", authorizeModules("valorizacion"), singleFileUpload, ConvencionalController.importStockValorizacionPreciosExcel);
router.put("/stock-valorizacion/lista-precios", authorizeModules("valorizacion"), ConvencionalController.saveStockValorizacionPrecio);

/**
 *
 * @route GET /
 * @desc Mis reservas.
 *
 */
router.get(
  "/stock-reservado/:numeroVendedor",
  authorizeModules("convencional"),
  authorizeRoleAccess("convencional.misReservas"),
  ConvencionalController.misReservas,
);

/**
 *
 * @route GET /
 * @desc Mi lista de espera.
 *
 */
router.get("/mi-lista-de-espera", authorizeModules("convencional"), authorizeRoleAccess("convencional.miListaEspera"), ConvencionalController.miListaDeEspera);

/**
 *
 * @route GET /
 * @desc Lista de espera.
 *
 */
router.get("/lista-de-espera", authorizeModules("convencional"), authorizeRoleAccess("convencional.listaEsperaGeneral"), ConvencionalController.listaDeEspera);

/**
 *
 * @route GET /
 * @desc Mi lista de espera.
 *
 */
router.get("/mis-reservas", authorizeModules("convencional"), authorizeRoleAccess("convencional.misReservas"), ConvencionalController.misReservas);

router.get("/mis-operaciones/:mes/:ano", authorizeModules("convencional"), authorizeRoleAccess("convencional.misOperaciones"), ConvencionalController.misOperaciones);
router.get("/promedio-operaciones/:mes/:ano", authorizeModules("promedio"), ConvencionalController.promedioOperaciones);
router.get("/ranking-operaciones/:ano", authorizeModules("ranking"), ConvencionalController.rankingOperaciones);
export default router;
