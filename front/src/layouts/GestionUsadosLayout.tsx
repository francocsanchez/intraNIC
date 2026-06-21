import { hasModulePathAccess } from "@/helpers/access";
import BaseAppLayout from "@/layouts/BaseAppLayout";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Link } from "react-router-dom";

export default function GestionUsadosLayout() {
  const { user } = useAuth();

  const canViewNoReparado = hasModulePathAccess(user, "noReparado", paths.usados.stockNoReparado);
  const canViewPendienteDocumentacion = hasModulePathAccess(
    user,
    "pendienteDocumentacion",
    paths.usados.stockPendienteDocumentacion,
  );
  const canViewIngresos = hasModulePathAccess(user, "ingresos", paths.usados.stockIngresos);

  return (
    <BaseAppLayout
      footerLeft="Gestion usados"
      footerRight={new Date().getFullYear()}
      centerContent={
        <>
          {canViewNoReparado ? (
            <Link to={paths.usados.stockNoReparado} className="hover:text-gray-900 transition">
              No reparado
            </Link>
          ) : null}

          {canViewPendienteDocumentacion ? (
            <Link to={paths.usados.stockPendienteDocumentacion} className="hover:text-gray-900 transition">
              Pendiente documentacion
            </Link>
          ) : null}

          {canViewIngresos ? (
            <Link to={paths.usados.stockIngresos} className="hover:text-gray-900 transition">
              Ingresos
            </Link>
          ) : null}
        </>
      }
    />
  );
}
