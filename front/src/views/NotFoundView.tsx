import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home, SearchX } from "lucide-react";
import { paths } from "@/routes/paths";

export default function NotFoundView() {
  return (
    <div className="w-full px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sistema</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Página no encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">La ruta que intentaste abrir no existe o ya no está disponible.</p>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-border p-8 lg:border-b-0 lg:border-r">
              <div className="inline-flex items-center gap-3 rounded-full border border-border bg-muted px-4 py-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Error 404</span>
              </div>

              <div className="mt-6 flex items-start gap-4">
                <div className="rounded-lg border border-border bg-muted p-4">
                  <SearchX className="h-12 w-12 text-foreground" />
                </div>

                <div>
                  <p className="text-6xl font-semibold tracking-tight text-foreground">404</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">No pudimos encontrar esta página</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    Puede que el enlace sea incorrecto, la página haya sido movida o que todavía no exista dentro del sistema.
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sugerencias</p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-border bg-card px-4 py-3">
                    <p className="text-sm font-medium text-foreground">Revisá la URL</p>
                    <p className="mt-1 text-xs text-muted-foreground">Verificá que la dirección esté escrita correctamente.</p>
                  </div>

                  <div className="rounded-lg border border-border bg-card px-4 py-3">
                    <p className="text-sm font-medium text-foreground">Volvé al menú principal</p>
                    <p className="mt-1 text-xs text-muted-foreground">Desde allí podés navegar otra vez a la sección correcta.</p>
                  </div>

                  <div className="rounded-lg border border-border bg-card px-4 py-3">
                    <p className="text-sm font-medium text-foreground">Intentá nuevamente más tarde</p>
                    <p className="mt-1 text-xs text-muted-foreground">Algunas vistas pueden estar en desarrollo o todavía no estar habilitadas.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-dashed border-border bg-card px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estado</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  La navegación sigue disponible. Podés volver al dashboard o regresar a la pantalla anterior sin perder el contexto de uso.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
