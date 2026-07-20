import { hasModulePathAccess } from "@/helpers/access";
import BaseAppLayout from "@/layouts/BaseAppLayout";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Cog, FileSpreadsheet, CarFront, ShieldCheck, UserCog } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const navItems = [
    {
      label: "Usuarios",
      to: paths.admin.usuarios,
      icon: UserCog,
      visible: hasModulePathAccess(user, "usuarios", paths.admin.usuarios),
      active: pathname === paths.admin.usuarios || pathname === paths.admin.crearUsuario || pathname.startsWith("/admin/usuarios/editar/"),
    },
    {
      label: "Configuracion",
      to: paths.admin.configuracion,
      icon: Cog,
      visible: hasModulePathAccess(user, "configuracion", paths.admin.configuracion),
      active:
        pathname === paths.admin.configuracion ||
        pathname === paths.admin.configuracionEnvioAgenda ||
        pathname === paths.admin.unidadesNegocio ||
        pathname === paths.admin.planNegocio ||
        pathname === paths.convencional.pedidoMensual ||
        pathname === paths.admin.configuracionConvencionalEditar ||
        pathname === paths.admin.configuracionUsadosEditar,
    },
    {
      label: "TestDrive",
      to: paths.admin.testDrive,
      icon: CarFront,
      visible: hasModulePathAccess(user, "testDrive", paths.admin.testDrive),
      active: pathname === paths.admin.testDrive,
    },
    {
      label: "Act. Registros",
      to: paths.analisis.registros,
      icon: FileSpreadsheet,
      visible: hasModulePathAccess(user, "actualizacionRegistros", paths.analisis.registros),
      active: pathname === paths.analisis.registros,
    },
    {
      label: "FSANCHEZ",
      to: paths.admin.fsanchez,
      icon: ShieldCheck,
      visible: hasModulePathAccess(user, "fsanchez", paths.admin.fsanchez),
      active: pathname === paths.admin.fsanchez,
    },
  ].filter((item) => item.visible);

  return (
    <BaseAppLayout
      footerLeft="Sistema"
      footerRight="Franco Sanchez"
      centerContent={
        <>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "inline-flex items-center gap-2 rounded-md px-3 py-2 transition",
                item.active ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              <item.icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          ))}
        </>
      }
      mainClassName="px-4 py-6"
    />
  );
}
