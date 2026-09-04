import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home, ShieldX } from "lucide-react";
import { paths } from "@/routes/paths";

export default function NoAutorizadoView() {
  return (
    <div className="w-full px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sistema</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Acceso no autorizado</h1>
          <p className="mt-2 text-sm text-muted-foreground">No posee los permisos necesarios para acceder a esta sección del sistema.</p>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-border p-8 lg:border-b-0 lg:border-r">
              <div className="inline-flex items-center gap-3 rounded-full border border-border bg-muted px-4 py-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Error 403</span>
              </div>

              <div className="mt-6 flex items-start gap-4">
                <div className="rounded-lg border border-border bg-muted p-4">
                  <ShieldX className="h-12 w-12 text-foreground" />
                </div>

                <div>
                  <p className="text-6xl font-semibold tracking-tight text-foreground">403</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">No tenés permisos para ingresar</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    Esta sección está restringida según tu rol o compañía dentro del sistema. Si creés que deberías tener acceso, comunicate con el
                    administrador.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={paths.home}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Home className="h-4 w-4" />
                  Ir al inicio
                </Link>

                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver atrás
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="rounded-lg border border-border bg-muted p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Información</p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-border bg-card px-4 py-3">
                    <p className="text-sm font-medium text-foreground">Permisos insuficientes</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tu usuario no posee los permisos necesarios para acceder a esta vista.</p>
                  </div>

                  <div className="rounded-lg border border-border bg-card px-4 py-3">
                    <p className="text-sm font-medium text-foreground">Contactar al administrador</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Si necesitás acceso a esta sección, solicitá habilitación al administrador del sistema.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-card px-4 py-3">
                    <p className="text-sm font-medium text-foreground">Continuar navegando</p>
                    <p className="mt-1 text-xs text-muted-foreground">Podés volver al inicio o regresar a la pantalla anterior.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-dashed border-border bg-card px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estado</p>
                <p className="mt-2 text-sm text-muted-foreground">El sistema sigue funcionando normalmente, pero esta vista requiere permisos adicionales.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
