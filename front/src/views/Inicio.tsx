import { CarFront, Car, Motorbike } from "lucide-react";
import { Link } from "react-router-dom";

export default function Inicio() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        {/* Título */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Unidades de negocio
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Seleccioná la unidad de negocio para continuar.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Convencional */}
          <Link
            to="/stock/disponible/convencional"
            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col items-center justify-center text-center"
          >
            <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
              <CarFront size={26} strokeWidth={1.5} className="text-gray-900" />
            </div>

            <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">
              Convencional
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Gestión de stock convencional
            </p>
          </Link>

          {/* Usados */}
          <div className="rounded-2xl border border-gray-200 bg-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center opacity-60 cursor-not-allowed">
            <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition">
              <Car size={26} strokeWidth={1.5} className="text-gray-900" />
            </div>

            <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">
              Usados
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Gestión de vehículos usados
            </p>
          </div>

          {/* Liess */}
          <div className="rounded-2xl border border-gray-200 bg-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center opacity-60 cursor-not-allowed">
            <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-200">
              <Motorbike
                size={26}
                strokeWidth={1.5}
                className="text-gray-600"
              />
            </div>

            <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-700">
              Liess
            </h2>

            <p className="text-sm text-gray-500 mt-1">Motos y monopatines</p>
          </div>
        </div>

        {/* Leyenda */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Si no posee habilitada alguna unidad de negocio, comuníquese con el
          administrador del sistema.
        </p>
      </div>
    </div>
  );
}
