import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/useAuthe";
import { CarFront, Car, Motorbike, LogOut } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

export default function Inicio() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, isError } = useAuth();

  if (isLoading) return <Loading />;

  if (isError || !isAuthenticated || !user) {
    localStorage.removeItem("AUTH_TOKEN");
    return <Navigate to="/login" replace />;
  }

  const companies = user.company ?? [];

  const hasNIC = companies.includes("convencional");
  const hasUSED = companies.includes("usados");
  const hasLIESS = companies.includes("liess");

  const baseCard = "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center";

  const disabledCard =
    "rounded-2xl border border-gray-200 bg-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center opacity-60 cursor-not-allowed";

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        {/* Título */}
        <div className="flex items-center justify-between mb-10">
          <div className="text-center w-full">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Unidades de negocio</h1>
            <p className="text-sm text-gray-500 mt-2">Seleccioná la unidad de negocio para continuar.</p>
          </div>

          <button
            onClick={handleLogout}
            className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
          >
            <LogOut size={14} strokeWidth={1.8} />
            Cerrar sesión
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Convencional */}
          {hasNIC ? (
            <Link to="/stock/disponible/convencional" className={`${baseCard} hover:shadow-md transition group`}>
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
                <CarFront size={26} strokeWidth={1.5} className="text-gray-900" />
              </div>

              <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Convencional</h2>

              <p className="text-sm text-gray-500 mt-1">Gestión de stock convencional</p>
            </Link>
          ) : (
            <div className={disabledCard}>
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100">
                <CarFront size={26} strokeWidth={1.5} className="text-gray-500" />
              </div>

              <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-700">Convencional</h2>

              <p className="text-sm text-gray-500 mt-1">Gestión de stock convencional</p>
            </div>
          )}

          {/* Usados */}
          {hasUSED ? (
            <Link to="/stock/disponible/usados" className={`${baseCard} hover:shadow-md transition group`}>
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
                <Car size={26} strokeWidth={1.5} className="text-gray-900" />
              </div>

              <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Usados</h2>

              <p className="text-sm text-gray-500 mt-1">Gestión de vehículos usados</p>
            </Link>
          ) : (
            <div className={disabledCard}>
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100">
                <Car size={26} strokeWidth={1.5} className="text-gray-500" />
              </div>

              <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-700">Usados</h2>

              <p className="text-sm text-gray-500 mt-1">Gestión de vehículos usados</p>
            </div>
          )}

          {/* Liess */}
          {hasLIESS ? (
            <Link to="/stock/disponible/liess" className={`${baseCard} hover:shadow-md transition group`}>
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
        </div>

        {/* Leyenda */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Si no posee habilitada alguna unidad de negocio, comuníquese con el administrador del sistema.
        </p>
      </div>
    </div>
  );
}
