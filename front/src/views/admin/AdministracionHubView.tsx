import { hasAnyModuleAccess, hasModulePathAccess, hasPathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { ClipboardList, FileWarning, List, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";

const cardClass =
  "rounded-lg border border-border bg-card p-6 shadow-sm transition hover:shadow-md";
const disabledCardClass =
  "rounded-lg border border-border bg-muted p-6 shadow-sm opacity-60";

export default function AdministracionHubView() {
  const { user } = useAuth();
  const canViewReventas = hasModulePathAccess(user, "reventaPendientes", paths.administracion.reventaPendientes);
  const canViewListaPrevia = hasModulePathAccess(user, "listaPrevia", paths.administracion.pedidoUnidadesListaPrevia);
  const canViewFacturasAnticipo = hasModulePathAccess(user, "facturasAnticipo", paths.administracion.facturasAnticipo);
  const canViewPedidoUnidadesRegistros = hasAnyModuleAccess(user, ["listaPrevia", "pedidoUnidades"])
    && hasPathAccess(user, paths.administracion.pedidoUnidadesRegistros);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Administracion</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Accesos del modulo</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Selecciona la operacion administrativa que necesitas gestionar.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {canViewReventas ? (
          <Link to={paths.administracion.reventaPendientes} className={cardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-foreground">
              <ReceiptText size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">Pendientes de Reventa</h2>
            <p className="mt-1 text-sm text-muted-foreground">Consulta y gestiona operaciones pendientes para reventas.</p>
          </Link>
        ) : (
          <div className={disabledCardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ReceiptText size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-muted-foreground">Pendientes de Reventa</h2>
            <p className="mt-1 text-sm text-muted-foreground">No disponible para tu perfil actual.</p>
          </div>
        )}

        {canViewListaPrevia ? (
          <Link to={paths.administracion.pedidoUnidadesListaPrevia} className={cardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-foreground">
              <ClipboardList size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">Pedido previo de unidades</h2>
            <p className="mt-1 text-sm text-muted-foreground">Carga internos y define prioridades antes de consolidar pedidos.</p>
          </Link>
        ) : (
          <div className={disabledCardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ClipboardList size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-muted-foreground">Pedido previo de unidades</h2>
            <p className="mt-1 text-sm text-muted-foreground">No disponible para tu perfil actual.</p>
          </div>
        )}

        {canViewPedidoUnidadesRegistros ? (
          <Link to={paths.administracion.pedidoUnidadesRegistros} className={cardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-foreground">
              <List size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">Registros de pedido de unidades</h2>
            <p className="mt-1 text-sm text-muted-foreground">Consulta el historial de unidades pedidas sin ingresar al flujo de carga.</p>
          </Link>
        ) : (
          <div className={disabledCardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <List size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-muted-foreground">Registros de pedido de unidades</h2>
            <p className="mt-1 text-sm text-muted-foreground">No disponible para tu perfil actual.</p>
          </div>
        )}

        {canViewFacturasAnticipo ? (
          <Link to={paths.administracion.facturasAnticipo} className={cardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-foreground">
              <FileWarning size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">Facturas de anticipo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Carga operaciones por OP y visualiza si ya tienen factura de anticipo.</p>
          </Link>
        ) : (
          <div className={disabledCardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileWarning size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-muted-foreground">Facturas de anticipo</h2>
            <p className="mt-1 text-sm text-muted-foreground">No disponible para tu perfil actual.</p>
          </div>
        )}

      </section>
    </div>
  );
}

