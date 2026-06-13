import Loading from "@/components/Loading";
import { hasAnyRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import {
  BarChart3,
  Car,
  CarFront,
  ClipboardList,
  Cog,
  FileText,
  LogOut,
  Motorbike,
  Upload,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

export default function Inicio() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, isError } = useAuth();

  if (isLoading) return <Loading />;

  if (isError || !isAuthenticated || !user) {
    localStorage.removeItem("AUTH_TOKEN");
    return <Navigate to={paths.login} replace />;
  }

  const companies = user.company ?? [];
  const hasNIC = companies.includes("convencional");
  const hasUSED = companies.includes("usados");
  const hasLIESS = companies.includes("liess");
  const hasSystem = hasAnyRole(user, ["admin", "stock", "supervisor"]);
  const hasAdministracion = hasAnyRole(user, [
    "admin",
    "administracion",
    "stock",
    "gerente",
    "supervisor",
    "vendedor",
  ]);
  const hasPreventas = hasNIC;
  const hasProformas = true;
  const hasOperaciones = hasAnyRole(user, ["admin", "supervisor", "gerente"]);
  const hasPatentamientos = hasAnyRole(user, ["admin", "supervisor", "gerente"]);

  const baseCard =
    "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center";

  const disabledCard =
    "rounded-2xl border border-gray-200 bg-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center opacity-60 cursor-not-allowed";

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    navigate(paths.login, { replace: true });
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-10">
          <div className="text-center w-full">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Unidades de negocio</h1>
            <p className="text-sm text-gray-500 mt-2">Selecciona la unidad de negocio para continuar.</p>
          </div>

          <button
            onClick={handleLogout}
            className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
          >
            <LogOut size={14} strokeWidth={1.8} />
            Cerrar sesion
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {hasNIC ? (
              <Link to={paths.convencional.stockDisponible} className={`${baseCard} hover:shadow-md transition group`}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
                  <CarFront size={26} strokeWidth={1.5} className="text-gray-900" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Convencional</h2>
                <p className="text-sm text-gray-500 mt-1">Gestion de vehiculos nuevos</p>
              </Link>
            ) : (
              <div className={disabledCard}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100">
                  <CarFront size={26} strokeWidth={1.5} className="text-gray-500" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-700">Convencional</h2>
                <p className="text-sm text-gray-500 mt-1">Gestion de vehiculos nuevos</p>
              </div>
            )}

            {hasUSED ? (
              <Link to={paths.usados.stockDisponible} className={`${baseCard} hover:shadow-md transition group`}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
                  <Car size={26} strokeWidth={1.5} className="text-gray-900" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Usados</h2>
                <p className="text-sm text-gray-500 mt-1">Gestion de vehiculos usados</p>
              </Link>
            ) : (
              <div className={disabledCard}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100">
                  <Car size={26} strokeWidth={1.5} className="text-gray-500" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-700">Usados</h2>
                <p className="text-sm text-gray-500 mt-1">Gestion de vehiculos usados</p>
              </div>
            )}

            {hasLIESS ? (
              <Link to={paths.liess.stockDisponible("nuevos")} className={`${baseCard} hover:shadow-md transition group`}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
                  <Motorbike size={26} strokeWidth={1.5} className="text-gray-900" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Liess</h2>
                <p className="text-sm text-gray-500 mt-1">Motos y monopatines</p>
              </Link>
            ) : (
              <div className={disabledCard}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-200">
                  <Motorbike size={26} strokeWidth={1.5} className="text-gray-600" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-700">Liess</h2>
                <p className="text-sm text-gray-500 mt-1">Motos y monopatines</p>
              </div>
            )}

            {hasPreventas ? (
              <Link to={paths.convencional.preventas} className={`${baseCard} hover:shadow-md transition group`}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
                  <ClipboardList size={26} strokeWidth={1.5} className="text-gray-900" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Preventas</h2>
                <p className="text-sm text-gray-500 mt-1">Demanda pendiente de asignacion</p>
              </Link>
            ) : (
              <div className={disabledCard}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-200">
                  <ClipboardList size={26} strokeWidth={1.5} className="text-gray-600" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Preventas</h2>
                <p className="text-sm text-gray-500 mt-1">Demanda pendiente de asignacion</p>
              </div>
            )}

            {hasProformas ? (
              <Link to={paths.convencional.proformas} className={`${baseCard} hover:shadow-md transition group`}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
                  <FileText size={26} strokeWidth={1.5} className="text-gray-900" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Proformas</h2>
                <p className="text-sm text-gray-500 mt-1">Cotizaciones con exportacion PDF</p>
              </Link>
            ) : (
              <div className={disabledCard}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-200">
                  <FileText size={26} strokeWidth={1.5} className="text-gray-600" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Proformas</h2>
                <p className="text-sm text-gray-500 mt-1">Cotizaciones con exportacion PDF</p>
              </div>
            )}

            {hasOperaciones ? (
              <Link to={paths.analisis.operaciones} className={`${baseCard} hover:shadow-md transition group`}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
                  <BarChart3 size={26} strokeWidth={1.5} className="text-gray-900" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Operaciones</h2>
                <p className="text-sm text-gray-500 mt-1">Dashboard de seguimiento comercial</p>
              </Link>
            ) : (
              <div className={disabledCard}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-200">
                  <BarChart3 size={26} strokeWidth={1.5} className="text-gray-600" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Operaciones</h2>
                <p className="text-sm text-gray-500 mt-1">Dashboard de seguimiento comercial</p>
              </div>
            )}

            {hasPatentamientos ? (
              <Link to={paths.analisis.patentamientos.dashboardMarcas} className={`${baseCard} hover:shadow-md transition group`}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
                  <Upload size={26} strokeWidth={1.5} className="text-gray-900" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Patentamientos</h2>
                <p className="text-sm text-gray-500 mt-1">Informe y comparativas visuales de patentamientos</p>
              </Link>
            ) : (
              <div className={disabledCard}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-200">
                  <Upload size={26} strokeWidth={1.5} className="text-gray-600" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Patentamientos</h2>
                <p className="text-sm text-gray-500 mt-1">Informe y comparativas visuales de patentamientos</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {hasSystem ? (
              <Link to={paths.admin.configuracion} className={`${baseCard} hover:shadow-md transition group`}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
                  <Cog size={26} strokeWidth={1.5} className="text-gray-900" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Sistema</h2>
                <p className="text-sm text-gray-500 mt-1">Config del sistema</p>
              </Link>
            ) : (
              <div className={disabledCard}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-200">
                  <Cog size={26} strokeWidth={1.5} className="text-gray-600" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Sistema</h2>
                <p className="text-sm text-gray-500 mt-1">Config del sistema</p>
              </div>
            )}

            {hasAdministracion ? (
              <Link to={paths.administracion.home} className={`${baseCard} hover:shadow-md transition group`}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
                  <Cog size={26} strokeWidth={1.5} className="text-gray-900" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Administracion</h2>
                <p className="text-sm text-gray-500 mt-1">Accesos administrativos</p>
              </Link>
            ) : (
              <div className={disabledCard}>
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-200">
                  <Cog size={26} strokeWidth={1.5} className="text-gray-600" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Administracion</h2>
                <p className="text-sm text-gray-500 mt-1">Accesos administrativos</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          Si no posee habilitada alguna unidad de negocio, comuniquese con el administrador del sistema.
        </p>
      </div>
    </div>
  );
}
