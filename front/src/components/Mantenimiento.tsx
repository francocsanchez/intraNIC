import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home, Wrench } from "lucide-react";

export default function Mantenimiento() {
  return (
    <div className="w-full px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Sistema
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
            Sistema en mantenimiento
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Esta sección se encuentra temporalmente deshabilitada por tareas de
            mantenimiento.
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-gray-200 p-8 lg:border-b-0 lg:border-r">
              <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
                <AlertTriangle className="h-4 w-4 text-gray-700" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-600">
                  Mantenimiento
                </span>
              </div>

              <div className="mt-6 flex items-start gap-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <Wrench className="h-12 w-12 text-gray-900" />
                </div>

                <div>
                  <p className="text-6xl font-semibold tracking-tight text-gray-900">
                    ⚙
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">
                    Estamos realizando tareas de mantenimiento
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                    El sistema de esta sección se encuentra temporalmente
                    deshabilitado mientras se realizan tareas de actualización
                    o mejoras. En breve volverá a estar disponible.
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Información
                </p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      Sistema temporalmente pausado
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Algunas funciones pueden estar deshabilitadas mientras se
                      realizan mejoras.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      Mejoras en curso
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Se están realizando actualizaciones para mejorar la
                      estabilidad y el rendimiento del sistema.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      Intentá nuevamente más tarde
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Esta sección volverá a estar disponible una vez finalizado
                      el mantenimiento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Estado
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  El resto del sistema continúa funcionando normalmente.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
