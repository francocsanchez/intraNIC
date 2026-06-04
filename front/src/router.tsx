import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import NICLayout from "./layouts/NICLayout";
import LiessLayout from "./layouts/LiessLayout";
import ReventasLayout from "./layouts/ReventasLayout";
import AdminModuleLayout from "./layouts/AdminModuleLayout";
import PatentamientosLayout from "./layouts/PatentamientosLayout";

import ProtectedRoute from "./layouts/ProtectedRoute";
import CompanyProtectedRoute from "./layouts/CompanyProtectedRoute";
import RoleProtectedRoute from "./layouts/RoleProtectedRoute";

import ConfiguracionView from "./views/admin/configuracion/ConfiguracionView";
import VendedoresView from "./views/admin/configuracion/VendedoresView";
import EditConfiguracionConvView from "./views/admin/configuracion/EditConfiguracionConvView";
import EditConfiguracionUsadoView from "./views/admin/configuracion/EditConfiguracionUsadoView";
import EditConfiguracionReventaView from "./views/admin/configuracion/EditConfiguracionReventaView";

import UsuariosView from "./views/admin/usuarios/UsuariosView";
import EditUsuarioView from "./views/admin/usuarios/EditUsuarioView";
import CrearUsuarioView from "./views/admin/usuarios/CrearUsuarioView";

import MiPerfilView from "./views/auth/MiPerfilView";
import MisOperacionesView from "./views/auth/MisOperacionesView";
import MisReservas from "./views/auth/MisReservas";
import MiListaDeEsperaView from "./views/auth/MiListaDeEsperaView";
import LoginUser from "./views/auth/LoginUser";

import Inicio from "./views/Inicio";
import AdministracionHubView from "./views/admin/AdministracionHubView";

import NotFoundView from "./views/NotFoundView";
import NoAutorizadoView from "./views/NoAutorizadoView";

import StockDisponibleConvencional from "./views/convencional/StockDisponibleConvencional";
import StockGuardadoConvencioanl from "./views/convencional/StockGuardadoConvencioanl";
import StockReservasConvencional from "./views/convencional/StockReservasConvencional";

import StockDisponibleLiess from "./views/liess/StockDisponibleLiess";
import AdminLayout from "./layouts/AdminLayout";
import AsignacionesView from "./views/admin/siac/AsignacionesView";
import StockDisponibleUsados from "./views/usados/StockDisponibleUsados";
import NICUsadosLayout from "./layouts/NICUsadosLayout";
import StockGuardadoUsados from "./views/usados/StockGuardadoUsados";
import StockReservasUsados from "./views/usados/StockReservasUsados";
import StockIngresoUsados from "./views/usados/StockIngresoUsados";
import PendienteReventaView from "./views/admin/siac/PendienteReventaView";
import PromediosConvencionalView from "./views/admin/siac/PromediosConvencionalView";
import RankingConvencionalView from "./views/admin/siac/RankingConvencionalView";
import StockDisponibleReventas from "./views/reventas/StockDisponibleReventas";
import PedidoUnidadesView from "./views/admin/siac/PedidoUnidadesView";
import PedidoUnidadesPreviasView from "./views/admin/siac/PedidoUnidadesPreviasView";
import FacturasAnticipoView from "./views/admin/siac/FacturasAnticipoView";
import RegistroAsignacionesView from "./views/admin/siac/RegistroAsignacionesView";
import RegistroAsignacionesResumenView from "./views/admin/siac/RegistroAsignacionesResumenView";
import PreventasView from "./views/admin/siac/PreventasView";
import PreventasAsignadasView from "./views/admin/siac/PreventasAsignadasView";
import PreventaFormView from "./views/admin/siac/PreventaFormView";
import PreventasResumenView from "./views/admin/siac/PreventasResumenView";
import ColoresView from "./views/admin/siac/ColoresView";
import ColorFormView from "./views/admin/siac/ColorFormView";
import VersionesView from "./views/admin/siac/VersionesView";
import VersionFormView from "./views/admin/siac/VersionFormView";
import PedidoMensualView from "./views/admin/siac/PedidoMensualView";
import ProformasView from "./views/admin/siac/ProformasView";
import ProformaFormView from "./views/admin/siac/ProformaFormView";
import ProformaDetailView from "./views/admin/siac/ProformaDetailView";
import OperacionesDashboardView from "./views/operaciones/OperacionesDashboardView";
import PatentamientosView from "./views/patentamientos/PatentamientosView";
import DashboardPatentamientosView from "./views/patentamientos/DashboardPatentamientosView";
import InscripcionUnidadesView from "./views/patentamientos/InscripcionUnidadesView";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginUser />} />
        <Route element={<ReventasLayout />}>
          <Route path="/stock-publico" element={<StockDisponibleReventas />} />
        </Route>
        <Route path="*" element={<NotFoundView />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/no-autorizado" element={<NoAutorizadoView />} />

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "supervisor", "stock"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/usuarios" element={<UsuariosView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "supervisor"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/configuracion" element={<ConfiguracionView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/usuarios/crear" element={<CrearUsuarioView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/usuarios/:idUsuario/editar" element={<EditUsuarioView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "gerente"]} />}>
            <Route element={<AdminLayout />}>
              <Route element={<CompanyProtectedRoute allowedCompany={["convencional"]} />}>
                <Route path="/configuracion/convencional/editar" element={<EditConfiguracionConvView />} />
              </Route>

              <Route element={<CompanyProtectedRoute allowedCompany={["usados"]} />}>
                <Route path="/configuracion/usados/editar" element={<EditConfiguracionUsadoView />} />
              </Route>

              <Route element={<CompanyProtectedRoute allowedCompany={["reventa"]} />}>
                <Route path="/configuracion/reventa/editar" element={<EditConfiguracionReventaView />} />
              </Route>
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path="/administracion" element={<AdministracionHubView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "stock", "administracion", "supervisor", "vendedor"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path="/reventa-pendientes" element={<PendienteReventaView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "administracion", "gerente"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path="/pedido-unidades/lista-previa" element={<PedidoUnidadesPreviasView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["administracion"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path="/administracion/facturas-anticipo" element={<FacturasAnticipoView />} />
            </Route>
          </Route>

          <Route element={<AdminModuleLayout />}>
            <Route path="/proformas" element={<ProformasView />} />
            <Route path="/proformas/nueva" element={<ProformaFormView />} />
            <Route path="/proformas/:id" element={<ProformaDetailView />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "supervisor", "gerente"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path="/operaciones" element={<OperacionesDashboardView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "supervisor", "gerente"]} />}>
            <Route element={<PatentamientosLayout />}>
              <Route path="/patentamientos" element={<Navigate to="/patentamientos/dashboard/general" replace />} />
              <Route path="/patentamientos/dashboard" element={<Navigate to="/patentamientos/dashboard/general" replace />} />
              <Route path="/patentamientos/dashboard/inscripcion-unidades" element={<InscripcionUnidadesView />} />
              <Route path="/patentamientos/dashboard/:section" element={<DashboardPatentamientosView />} />
              <Route path="/patentamientos/importar" element={<PatentamientosView />} />
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["convencional"]} />}>
            <Route element={<NICLayout />}>
              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"]} />}>
                <Route path="/mi-perfil/convencional" element={<MiPerfilView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/dms/vendedores" element={<VendedoresView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "stock"]} />}>
                <Route path="/stock/guardado/convencional" element={<StockGuardadoConvencioanl />} />
                <Route path="/asignaciones" element={<AsignacionesView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "vendedor", "stock", "administracion"]} />}>
                <Route path="/preventas" element={<PreventasView />} />
                <Route path="/preventas/resumen" element={<PreventasResumenView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "supervisor"]} />}>
                <Route path="/preventas/asignadas" element={<PreventasAsignadasView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "supervisor"]} />}>
                <Route path="/preventas/nueva" element={<PreventaFormView />} />
                <Route path="/preventas/:id/editar" element={<PreventaFormView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "administracion", "gerente"]} />}>
                <Route path="/pedido-unidades" element={<PedidoUnidadesView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "stock"]} />}>
                <Route path="/registro-asignaciones" element={<RegistroAsignacionesView />} />
                <Route path="/registro-asignaciones/resumen" element={<RegistroAsignacionesResumenView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["stock", "admin", "gerente"]} />}>
                <Route path="/preventas/pedido-mensual" element={<PedidoMensualView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock"]} />}>
                <Route path="/preventas/colores" element={<ColoresView />} />
                <Route path="/preventas/colores/nuevo" element={<ColorFormView />} />
                <Route path="/preventas/colores/:id/editar" element={<ColorFormView />} />
                <Route path="/preventas/versiones" element={<VersionesView />} />
                <Route path="/preventas/versiones/nuevo" element={<VersionFormView />} />
                <Route path="/preventas/versiones/:id/editar" element={<VersionFormView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "vendedor", "stock"]} />}>
                <Route path="/promedio-convencional" element={<PromediosConvencionalView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "stock"]} />}>
                <Route path="/stock/reservado/convencional" element={<StockReservasConvencional />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"]} />}>
                <Route path="/mis-reservas/convencional" element={<MisReservas />} />
                <Route path="/mi-lista-espera/convencional" element={<MiListaDeEsperaView />} />
                <Route path="/mis-operaciones/convencional" element={<MisOperacionesView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "vendedor", "stock"]} />}>
                <Route path="/ranking-convencional" element={<RankingConvencionalView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "vendedor", "stock"]} />}>
                <Route path="/stock/disponible/convencional" element={<StockDisponibleConvencional />} />
              </Route>
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["usados"]} />}>
            <Route element={<NICUsadosLayout />}>
              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "vendedor", "stock"]} />}>
                <Route path="/stock/disponible/usados" element={<StockDisponibleUsados />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "stock"]} />}>
                <Route path="/stock/guardado/usados" element={<StockGuardadoUsados />} />
                <Route path="/stock/reservado/usados" element={<StockReservasUsados />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "stock"]} />}>
                <Route path="/stock/ingresos/usados" element={<StockIngresoUsados />} />
              </Route>
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["liess"]} />}>
            <Route element={<LiessLayout />}>
              <Route path="/mi-perfil/liess" element={<MiPerfilView />} />

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "vendedor", "stock"]} />}>
                <Route path="/stock/disponible/liess/:tipo" element={<StockDisponibleLiess />} />
              </Route>
            </Route>
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

