import { NextFunction, Request, Response, Router } from "express";
import { PreventaController } from "../controllers/PreventaController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();
const lecturaRoles = ["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"];
const asignadasRoles = ["admin", "stock", "supervisor"];
const gestionRoles = ["admin", "stock", "supervisor"];
const asignarRoles = ["admin", "stock"];

const userHasAnyRole = (req: Request, allowedRoles: string[]) => {
  const userRoles = req.user?.role ?? [];
  return userRoles.some((role) => allowedRoles.includes(role));
};

const authorizePreventasList = (req: Request, res: Response, next: NextFunction) => {
  const allowedRoles = req.query.asignado === "true" ? asignadasRoles : lecturaRoles;

  if (!userHasAnyRole(req, allowedRoles)) {
    return res.status(403).json({ error: "No tienes permisos para acceder a este recurso" });
  }

  next();
};

router.use(authenticate);
router.use(authorizeCompanies("convencional"));

router.get(
  "/resumen-pendientes",
  authorizeRoles(...lecturaRoles),
  PreventaController.resumenPendientes,
);
router.get(
  "/resumen-pedido-mensual",
  authorizeRoles(...lecturaRoles),
  PreventaController.resumenPedidoMensual,
);

router.get("/", authorizePreventasList, PreventaController.list);
router.get("/:id", authorizeRoles(...gestionRoles), PreventaController.getById);
router.post("/", authorizeRoles(...gestionRoles), PreventaController.create);
router.put("/:id", authorizeRoles(...gestionRoles), PreventaController.update);
router.delete("/:id", authorizeRoles(...gestionRoles), PreventaController.remove);
router.patch(
  "/:id/asignado",
  authorizeRoles(...asignarRoles),
  PreventaController.updateAsignado,
);

export default router;
