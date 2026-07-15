import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { AgendaEntregaController } from "../controllers/AgendaEntregaController";
import { AgendaEntregaLogController } from "../controllers/AgendaEntregaLogController";
import { PendienteTurnarController } from "../controllers/PendienteTurnarController";
import { SucursalEntregaController } from "../controllers/SucursalEntregaController";
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

router.get("/interno/:interno", AgendaEntregaController.getInterno);

router.get("/agendas", AgendaEntregaController.list);
router.post("/agendas/reservas", AgendaEntregaController.createReserva);
router.put("/agendas/reservas/:id", AgendaEntregaController.updateReserva);
router.delete("/agendas/reservas/:id", AgendaEntregaController.remove);
router.post("/agendas/reservas/:id/convertir", AgendaEntregaController.convertReserva);
router.get("/agendas/:id", AgendaEntregaController.getById);
router.post("/agendas", AgendaEntregaController.create);
router.put("/agendas/:id", AgendaEntregaController.update);
router.patch("/agendas/:id/equipado", AgendaEntregaController.toggleEquipado);
router.patch("/agendas/:id/entregada-por", AgendaEntregaController.toggleEntregadaPor);
router.delete("/agendas/:id", AgendaEntregaController.remove);

router.get("/pendientes-turnar", authorizeModules("pendientesTurnar"), PendienteTurnarController.list);
router.post(
  "/pendientes-turnar/importar",
  authorizeModules("pendientesTurnar"),
  singleFileUpload,
  PendienteTurnarController.importData,
);
router.post("/pendientes-turnar", authorizeModules("pendientesTurnar"), PendienteTurnarController.create);
router.put("/pendientes-turnar/:id", authorizeModules("pendientesTurnar"), PendienteTurnarController.update);
router.delete("/pendientes-turnar/:id", authorizeModules("pendientesTurnar"), PendienteTurnarController.remove);
router.post("/pendientes-turnar/:id/turnar", authorizeModules("pendientesTurnar"), PendienteTurnarController.turnar);

router.get("/sucursales", SucursalEntregaController.list);
router.post("/sucursales", SucursalEntregaController.create);
router.put("/sucursales/:id", SucursalEntregaController.update);
router.delete("/sucursales/:id", SucursalEntregaController.remove);

router.get("/registros", AgendaEntregaLogController.list);

export default router;
