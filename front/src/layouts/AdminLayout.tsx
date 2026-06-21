import { hasModulePathAccess } from "@/helpers/access";
import BaseAppLayout from "@/layouts/BaseAppLayout";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Link } from "react-router-dom";

export default function AdminLayout() {
  const { user } = useAuth();

  const canViewUsuarios = hasModulePathAccess(user, "usuarios", paths.admin.usuarios);
  const canViewConfiguracion = hasModulePathAccess(user, "configuracion", paths.admin.configuracion);
  const canViewTestDrive = hasModulePathAccess(user, "testDrive", paths.admin.testDrive);

  return (
    <BaseAppLayout
      footerLeft="Panel de administracion"
      footerRight={new Date().getFullYear()}
      centerContent={
        <>
          {canViewUsuarios ? (
            <Link to={paths.admin.usuarios} className="hover:text-gray-900 transition">
              Usuarios
            </Link>
          ) : null}

          {canViewConfiguracion ? (
            <Link to={paths.admin.configuracion} className="hover:text-gray-900 transition">
              Configuracion
            </Link>
          ) : null}

          {canViewTestDrive ? (
            <Link to={paths.admin.testDrive} className="hover:text-gray-900 transition">
              TestDrive
            </Link>
          ) : null}
        </>
      }
    />
  );
}
