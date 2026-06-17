import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import NICLayout from "./layouts/NICLayout";
import LiessLayout from "./layouts/LiessLayout";
import ReventasLayout from "./layouts/ReventasLayout";
import AdminModuleLayout from "./layouts/AdminModuleLayout";
import PatentamientosLayout from "./layouts/PatentamientosLayout";
import ProfileLayout from "./layouts/ProfileLayout";
import GestionConvencionalLayout from "./layouts/GestionConvencionalLayout";
import GestionUsadosLayout from "./layouts/GestionUsadosLayout";
import AnalisisLayout from "./layouts/AnalisisLayout";

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
import MisReservasUsadosView from "./views/usados/MisReservasUsadosView";
import StockNoReparadoUsadosView from "./views/usados/StockNoReparadoUsadosView";
import StockPendDocuUsadosView from "./views/usados/StockPendDocuUsadosView";
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
import { paths } from "./routes/paths";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={paths.login} element={<LoginUser />} />
        <Route element={<ReventasLayout />}>
          <Route path={paths.stockPublico} element={<StockDisponibleReventas />} />
        </Route>
        <Route path="*" element={<NotFoundView />} />

        <Route element={<ProtectedRoute />}>
          <Route path={paths.home} element={<Inicio />} />
          <Route element={<ProfileLayout />}>
            <Route path={paths.miPerfil} element={<MiPerfilView />} />
          </Route>
          <Route path={paths.noAutorizado} element={<NoAutorizadoView />} />

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "supervisor", "stock"]} />}>
            <Route element={<AdminLayout />}>
              <Route path={paths.admin.usuarios} element={<UsuariosView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "supervisor"]} />}>
            <Route element={<AdminLayout />}>
              <Route path={paths.admin.configuracion} element={<ConfiguracionView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock"]} />}>
            <Route element={<AdminLayout />}>
              <Route path={paths.admin.crearUsuario} element={<CrearUsuarioView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/usuarios/:idUsuario/editar" element={<EditUsuarioView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "gerente"]} />}>
            <Route element={<AdminLayout />}>
              <Route element={<CompanyProtectedRoute allowedCompany={["convencional"]} />}>
                <Route path={paths.admin.configuracionConvencionalEditar} element={<EditConfiguracionConvView />} />
              </Route>

              <Route element={<CompanyProtectedRoute allowedCompany={["usados"]} />}>
                <Route path={paths.admin.configuracionUsadosEditar} element={<EditConfiguracionUsadoView />} />
              </Route>

              <Route element={<CompanyProtectedRoute allowedCompany={["reventa"]} />}>
                <Route path={paths.admin.configuracionReventaEditar} element={<EditConfiguracionReventaView />} />
              </Route>
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path={paths.administracion.home} element={<AdministracionHubView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "stock", "administracion", "supervisor", "vendedor"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path={paths.administracion.reventaPendientes} element={<PendienteReventaView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "administracion", "gerente"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path={paths.administracion.pedidoUnidadesListaPrevia} element={<PedidoUnidadesPreviasView />} />
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["administracion"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path={paths.administracion.facturasAnticipo} element={<FacturasAnticipoView />} />
            </Route>
          </Route>

          <Route element={<AdminModuleLayout />}>
            <Route path={paths.convencional.proformas} element={<ProformasView />} />
            <Route path={paths.convencional.proformasNueva} element={<ProformaFormView />} />
            <Route path="/convencional/proformas/:id" element={<ProformaDetailView />} />
          </Route>

          <Route element={<AnalisisLayout />}>
            <Route element={<RoleProtectedRoute allowedRoles={["admin", "supervisor", "gerente"]} />}>
              <Route path={paths.analisis.operaciones} element={<OperacionesDashboardView />} />
            </Route>

            <Route element={<CompanyProtectedRoute allowedCompany={["convencional"]} />}>
              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "vendedor", "stock"]} />}>
                <Route path={paths.convencional.ranking} element={<RankingConvencionalView />} />
                <Route path={paths.convencional.promedio} element={<PromediosConvencionalView />} />
              </Route>
            </Route>
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin", "supervisor", "gerente"]} />}>
            <Route element={<PatentamientosLayout />}>
              <Route path={paths.analisis.patentamientos.home} element={<Navigate to={paths.analisis.patentamientos.dashboardGeneral} replace />} />
              <Route path={paths.analisis.patentamientos.dashboard} element={<Navigate to={paths.analisis.patentamientos.dashboardGeneral} replace />} />
              <Route path={paths.analisis.patentamientos.dashboardInscripcionUnidades} element={<InscripcionUnidadesView />} />
              <Route path="/analisis/patentamientos/dashboard/:section" element={<DashboardPatentamientosView />} />
              <Route path={paths.analisis.patentamientos.importar} element={<PatentamientosView />} />
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["convencional"]} />}>
            <Route element={<NICLayout />}>
              <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/dms/vendedores" element={<VendedoresView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "stock"]} />}>
                <Route path={paths.convencional.stockGuardado} element={<StockGuardadoConvencioanl />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "vendedor", "stock", "administracion"]} />}>
                <Route path={paths.convencional.preventas} element={<PreventasView />} />
                <Route path={paths.convencional.preventasResumen} element={<PreventasResumenView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "supervisor"]} />}>
                <Route path={paths.convencional.preventasAsignadas} element={<PreventasAsignadasView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "supervisor"]} />}>
                <Route path={paths.convencional.preventasNueva} element={<PreventaFormView />} />
                <Route path="/convencional/preventas/:id/editar" element={<PreventaFormView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock"]} />}>
                <Route path={paths.convencional.preventasColores} element={<ColoresView />} />
                <Route path={paths.convencional.preventasColoresNuevo} element={<ColorFormView />} />
                <Route path="/convencional/preventas/colores/:id/editar" element={<ColorFormView />} />
                <Route path={paths.convencional.preventasVersiones} element={<VersionesView />} />
                <Route path={paths.convencional.preventasVersionesNuevo} element={<VersionFormView />} />
                <Route path="/convencional/preventas/versiones/:id/editar" element={<VersionFormView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "stock"]} />}>
                <Route path={paths.convencional.stockReservado} element={<StockReservasConvencional />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"]} />}>
                <Route path={paths.convencional.misReservas} element={<MisReservas />} />
                <Route path={paths.convencional.miListaEspera} element={<MiListaDeEsperaView />} />
                <Route path={paths.convencional.misOperaciones} element={<MisOperacionesView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "vendedor", "stock"]} />}>
                <Route path={paths.convencional.stockDisponible} element={<StockDisponibleConvencional />} />
              </Route>
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["convencional"]} />}>
            <Route element={<GestionConvencionalLayout />}>
              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "stock"]} />}>
                <Route path={paths.convencional.asignaciones} element={<AsignacionesView />} />
                <Route path={paths.convencional.registroAsignaciones} element={<RegistroAsignacionesView />} />
                <Route path={paths.convencional.registroAsignacionesResumen} element={<RegistroAsignacionesResumenView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["stock", "admin", "gerente"]} />}>
                <Route path={paths.convencional.pedidoMensual} element={<PedidoMensualView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "administracion", "gerente"]} />}>
                <Route path={paths.convencional.pedidoUnidades} element={<PedidoUnidadesView />} />
              </Route>
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["usados"]} />}>
            <Route element={<NICUsadosLayout />}>
              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "vendedor", "stock"]} />}>
                <Route path={paths.usados.stockDisponible} element={<StockDisponibleUsados />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"]} />}>
                <Route path={paths.usados.misReservas} element={<MisReservasUsadosView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "stock"]} />}>
                <Route path={paths.usados.stockGuardado} element={<StockGuardadoUsados />} />
                <Route path={paths.usados.stockReservado} element={<StockReservasUsados />} />
              </Route>

            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["usados"]} />}>
            <Route element={<GestionUsadosLayout />}>
              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "stock"]} />}>
                <Route path={paths.usados.stockNoReparado} element={<StockNoReparadoUsadosView />} />
                <Route path={paths.usados.stockPendienteDocumentacion} element={<StockPendDocuUsadosView />} />
                <Route path={paths.usados.stockIngresos} element={<StockIngresoUsados />} />
              </Route>
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["liess"]} />}>
            <Route element={<LiessLayout />}>
              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "vendedor", "stock"]} />}>
                <Route path="/liess/stock/:tipo" element={<StockDisponibleLiess />} />
              </Route>
            </Route>
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

