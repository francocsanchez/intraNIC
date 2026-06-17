import { hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { ClipboardList, FileWarning, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";

const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md";
const disabledCardClass =
  "rounded-2xl border border-gray-200 bg-gray-100 p-6 shadow-sm opacity-60";

export default function AdministracionHubView() {
  const { user } = useAuth();
  const canViewReventas = hasModulePathAccess(user, "reventaPendientes", paths.administracion.reventaPendientes);
  const canViewListaPrevia = hasModulePathAccess(user, "listaPrevia", paths.administracion.pedidoUnidadesListaPrevia);
  const canViewFacturasAnticipo = hasModulePathAccess(user, "facturasAnticipo", paths.administracion.facturasAnticipo);
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administracion</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">Accesos del modulo</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">
          Selecciona la operacion administrativa que necesitas gestionar.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {canViewReventas ? (
          <Link to={paths.administracion.reventaPendientes} className={cardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
              <ReceiptText size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Pendientes de Reventa</h2>
            <p className="mt-1 text-sm text-gray-500">Consulta y gestiona operaciones pendientes para reventas.</p>
          </Link>
        ) : (
          <div className={disabledCardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200 text-gray-600">
              <ReceiptText size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-700">Pendientes de Reventa</h2>
            <p className="mt-1 text-sm text-gray-500">No disponible para tu perfil actual.</p>
          </div>
        )}

        {canViewListaPrevia ? (
          <Link to={paths.administracion.pedidoUnidadesListaPrevia} className={cardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
              <ClipboardList size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Pedido previo de unidades</h2>
            <p className="mt-1 text-sm text-gray-500">Carga internos y define prioridades antes de consolidar pedidos.</p>
          </Link>
        ) : (
          <div className={disabledCardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200 text-gray-600">
              <ClipboardList size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-700">Pedido previo de unidades</h2>
            <p className="mt-1 text-sm text-gray-500">No disponible para tu perfil actual.</p>
          </div>
        )}

        {canViewFacturasAnticipo ? (
          <Link to={paths.administracion.facturasAnticipo} className={cardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
              <FileWarning size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-900">Facturas de anticipo</h2>
            <p className="mt-1 text-sm text-gray-500">Carga operaciones por OP y visualiza si ya tienen factura de anticipo.</p>
          </Link>
        ) : (
          <div className={disabledCardClass}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200 text-gray-600">
              <FileWarning size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-gray-700">Facturas de anticipo</h2>
            <p className="mt-1 text-sm text-gray-500">No disponible para tu perfil actual.</p>
          </div>
        )}
      </section>
    </div>
  );
}

