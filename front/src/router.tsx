import { BrowserRouter, Routes, Route } from "react-router-dom";

import StockDisponibleConvencional from "./views/convencional/StockDisponibleConvencional";
import StockGuardadoConvencioanl from "./views/convencional/StockGuardadoConvencioanl";
import StockReservasConvencional from "./views/convencional/StockReservasConvencional";
import ConfiguracionView from "./views/admin/configuracion/ConfiguracionView";
import VendedoresView from "./views/admin/configuracion/VendedoresView";
import EditConfiguracionConvView from "./views/admin/configuracion/EditConfiguracionConvView";
import EditConfiguracionUsadoView from "./views/admin/configuracion/EditConfiguracionUsadoView";
import UsuariosView from "./views/admin/usuarios/UsuariosView";
import EditUsuarioView from "./views/admin/usuarios/EditUsuarioView";
import CrearUsuarioView from "./views/admin/usuarios/CrearUsuarioView";
import NotFoundView from "./views/NotFoundView";
import LoginUser from "./views/auth/LoginUser";
import Inicio from "./views/Inicio";
import ProtectedRoute from "./layouts/ProtectedRoute";
import MiPerfilView from "./views/auth/MiPerfilView";
import NoAutorizadoView from "./views/NoAutorizadoView";
import RoleProtectedRoute from "./layouts/RoleProtectedRoute";
import CompanyProtectedRoute from "./layouts/CompanyProtectedRoute";
import NICLayout from "./layouts/NICLayout";
import LiessLayout from "./layouts/LiessLayout";
import StockDisponibleLiess from "./views/liess/StockDisponibleLiess";
import MisReservas from "./views/auth/MisReservas";
import MiListaDeEsperaView from "./views/auth/MiListaDeEsperaView";
import MisOperacionesView from "./views/auth/MisOperacionesView";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginUser />} />
        <Route path="*" element={<NotFoundView />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/no-autorizado" element={<NoAutorizadoView />} />

          <Route element={<CompanyProtectedRoute allowedCompany={["liess", "convencional", "usados"]} />}></Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["convencional"]} />}>
            <Route element={<NICLayout />}>
              <Route path="/mi-perfil/convencional" element={<MiPerfilView />} />
              <Route path="/mis-reservas/convencional" element={<MisReservas />} />
              <Route path="/mi-lista-espera/convencional" element={<MiListaDeEsperaView />} />
              <Route path="/mis-operaciones/convencional" element={<MisOperacionesView />} />

              <Route path="/stock/disponible/convencional" element={<StockDisponibleConvencional />} />
              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente", "supervisor"]} />}>
                <Route path="/stock/reservado/convencional" element={<StockReservasConvencional />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={["admin", "gerente"]} />}>
                <Route path="/stock/guardado/convencional" element={<StockGuardadoConvencioanl />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/dms/vendedores" element={<VendedoresView />} />
                <Route path="/admin/configuracion" element={<ConfiguracionView />} />
                <Route path="/admin/configuracion/convencional/editar" element={<EditConfiguracionConvView />} />
                <Route path="/admin/configuracion/usados/editar" element={<EditConfiguracionUsadoView />} />
                <Route path="/admin/usuarios" element={<UsuariosView />} />
                <Route path="/admin/usuarios/crear" element={<CrearUsuarioView />} />
                <Route path="/admin/usuarios/:idUsuario/editar" element={<EditUsuarioView />} />
              </Route>
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["liess"]} />}>
            <Route element={<LiessLayout />}>
              <Route path="/mi-perfil/liess" element={<MiPerfilView />} />
              <Route path="/stock/disponible/liess" element={<StockDisponibleLiess />} />
            </Route>
          </Route>

          <Route element={<CompanyProtectedRoute allowedCompany={["usados"]} />}></Route>
          <Route element={<CompanyProtectedRoute allowedCompany={["liess"]} />}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
