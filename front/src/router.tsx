import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";

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

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<UserLayout />}>
          <Route
            path="/stock/disponible/convencional"
            element={<StockDisponibleConvencional />}
          />
          <Route
            path="/stock/guardado/convencional"
            element={<StockGuardadoConvencioanl />}
          />
          <Route
            path="/stock/reservado/convencional"
            element={<StockReservasConvencional />}
          />

          <Route path="/admin/dms/vendedores" element={<VendedoresView />} />

          <Route path="/admin/configuracion" element={<ConfiguracionView />} />
          <Route
            path="/admin/configuracion/convencional/editar"
            element={<EditConfiguracionConvView />}
          />
          <Route
            path="/admin/configuracion/usados/editar"
            element={<EditConfiguracionUsadoView />}
          />

          <Route path="/admin/usuarios" element={<UsuariosView />} />
          <Route path="/admin/usuarios/crear" element={<CrearUsuarioView />} />
          <Route path="/admin/usuarios/:idUsuario/editar" element={<EditUsuarioView />} />

          <Route path="*" element={<NotFoundView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
