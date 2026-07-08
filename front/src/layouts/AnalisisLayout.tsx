import { hasModulePathAccess } from "@/helpers/access";
import BaseAppLayout from "@/layouts/BaseAppLayout";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Link } from "react-router-dom";

export default function AnalisisLayout() {
  const { user } = useAuth();

  const canViewOperaciones = hasModulePathAccess(user, "operaciones", paths.analisis.operaciones);
  const canViewRanking = hasModulePathAccess(user, "ranking", paths.convencional.ranking);
  const canViewPromedio = hasModulePathAccess(user, "promedio", paths.convencional.promedio);
  const canViewTransferencias = hasModulePathAccess(
    user,
    "transferencias",
    paths.analisis.transferencias.dashboardGeneral,
  );

  return (
    <BaseAppLayout
      footerLeft="Analisis"
      footerRight={new Date().getFullYear()}
      centerContent={
        <>
          {canViewOperaciones ? (
            <Link to={paths.analisis.operaciones} className="hover:text-gray-900 transition">
              Operaciones
            </Link>
          ) : null}

          {canViewRanking ? (
            <Link to={paths.convencional.ranking} className="hover:text-gray-900 transition">
              Ranking
            </Link>
          ) : null}

          {canViewPromedio ? (
            <Link to={paths.convencional.promedio} className="hover:text-gray-900 transition">
              Promedio
            </Link>
          ) : null}

          {canViewTransferencias ? (
            <Link to={paths.analisis.transferencias.dashboardGeneral} className="hover:text-gray-900 transition">
              Transferencias
            </Link>
          ) : null}
        </>
      }
    />
  );
}
