import { BrowserRouter, Routes, Route } from "react-router-dom";

import NICLayout from "./layouts/NICLayout";
import LiessLayout from "./layouts/LiessLayout";

import ProtectedRoute from "./layouts/ProtectedRoute";
import CompanyProtectedRoute from "./layouts/CompanyProtectedRoute";
import RoleProtectedRoute from "./layouts/RoleProtectedRoute";

import ConfiguracionView from "./views/admin/configuracion/ConfiguracionView";
import VendedoresView from "./views/admin/configuracion/VendedoresView";
import EditConfiguracionConvView from "./views/admin/configuracion/EditConfiguracionConvView";
import EditConfiguracionUsadoView from "./views/admin/configuracion/EditConfiguracionUsadoView";

import UsuariosView from "./views/admin/usuarios/UsuariosView";
import EditUsuarioView from "./views/admin/usuarios/EditUsuarioView";
import CrearUsuarioView from "./views/admin/usuarios/CrearUsuarioView";

import MiPerfilView from "./views/auth/MiPerfilView";
import MisOperacionesView from "./views/auth/MisOperacionesView";
import MisReservas from "./views/auth/MisReservas";
import MiListaDeEsperaView from "./views/auth/MiListaDeEsperaView";
import LoginUser from "./views/auth/LoginUser";

import Inicio from "./views/Inicio";

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
import ConsolidadoView from "./views/admin/siac/ConsolidadoView";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginUser />} />
        <Route path="*" element={<NotFoundView />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/no-autorizado" element={<NoAutorizadoView />} />

          <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/usuarios" element={<UsuariosView />} />
              <Route path="/usuarios/crear" element={<CrearUsuarioView />} />
              <Route path="/usuarios/:idUsuario/editar" element={<EditUsuarioView />} />

              <Route path="/configuracion" element={<ConfiguracionView />} />
              <Route path="/configuracion/convencional/editar" element={<EditConfiguracionConvView />} />
              <Route path="/configuracion/usados/editar" element={<EditConfiguracionUsadoView />} />
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["convencional"]} />}>
            <Route element={<NICLayout />}>
              <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/dms/vendedores" element={<VendedoresView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente"]} />}>
                <Route path="/stock/guardado/convencional" element={<StockGuardadoConvencioanl />} />
                <Route path="/asignaciones" element={<AsignacionesView />} />
                <Route path="/consolidado" element={<ConsolidadoView />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor"]} />}>
                <Route path="/stock/reservado/convencional" element={<StockReservasConvencional />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "vendedor"]} />}>
                <Route path="/mi-perfil/convencional" element={<MiPerfilView />} />
                <Route path="/mis-reservas/convencional" element={<MisReservas />} />
                <Route path="/mi-lista-espera/convencional" element={<MiListaDeEsperaView />} />
                <Route path="/mis-operaciones/convencional" element={<MisOperacionesView />} />
                <Route path="/stock/disponible/convencional" element={<StockDisponibleConvencional />} />
              </Route>
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["usados"]} />}>
            <Route element={<NICUsadosLayout />}>
              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor", "vendedor"]} />}>
                <Route path="/stock/disponible/usados" element={<StockDisponibleUsados />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente"]} />}>
                <Route path="/stock/guardado/usados" element={<StockGuardadoUsados />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor"]} />}>
                <Route path="/stock/reservado/usados" element={<StockReservasUsados />} />
              </Route>
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["liess"]} />}>
            <Route element={<LiessLayout />}>
              <Route path="/mi-perfil/liess" element={<MiPerfilView />} />
              <Route path="/stock/disponible/liess/:tipo" element={<StockDisponibleLiess />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
