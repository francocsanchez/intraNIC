import { hasModuleAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Navigate } from "react-router-dom";

export default function CalidadHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={hasModuleAccess(user, "ssiVentas") ? paths.calidad.ssiVentas : paths.calidad.ventas} replace />;
}
