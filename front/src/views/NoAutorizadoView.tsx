import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home, ShieldX } from "lucide-react";

export default function NoAutorizadoView() {
  return (
    <div className="w-full px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Sistema</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Acceso no autorizado</h1>
          <p className="mt-2 text-sm text-gray-500">No posee los permisos necesarios para acceder a esta sección del sistema.</p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-gray-200 p-8 lg:border-b-0 lg:border-r">
              <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
                <AlertTriangle className="h-4 w-4 text-gray-700" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-600">Error 403</span>
              </div>

              <div className="mt-6 flex items-start gap-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <ShieldX className="h-12 w-12 text-gray-900" />
                </div>

                <div>
                  <p className="text-6xl font-semibold tracking-tight text-gray-900">403</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">No tenés permisos para ingresar</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                    Esta sección está restringida según tu rol o compañía dentro del sistema. Si creés que deberías tener acceso, comunicate con el
                    administrador.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-900"
                >
                  <Home className="h-4 w-4" />
                  Ir al inicio
                </Link>

                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver atrás
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Información</p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Permisos insuficientes</p>
                    <p className="mt-1 text-xs text-gray-500">Tu usuario no posee los permisos necesarios para acceder a esta vista.</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Contactar al administrador</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Si necesitás acceso a esta sección, solicitá habilitación al administrador del sistema.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Continuar navegando</p>
                    <p className="mt-1 text-xs text-gray-500">Podés volver al inicio o regresar a la pantalla anterior.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Estado</p>
                <p className="mt-2 text-sm text-gray-700">El sistema sigue funcionando normalmente, pero esta vista requiere permisos adicionales.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
