import { useAuth } from "@/hooks/useAuthe";
import { Building2, CircleUserRound, Hash, KeyRound, Mail } from "lucide-react";

export default function MiPerfilView() {
  const { user, isLoading, isError } = useAuth();

  if (isLoading) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Cargando perfil...</p>
        </section>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar el perfil
          </h1>
          <p className="mt-2 text-sm text-red-600">
            No fue posible obtener la información del usuario.
          </p>
        </section>
      </div>
    );
  }

  const fullName = `${user.name ?? ""} ${user.lastName ?? ""}`.trim();

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Mi perfil
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
          Información del usuario
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Resumen general de tu cuenta dentro del sistema.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Usuario
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-gray-900">
            {fullName || "Sin nombre"}
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Compañías
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-gray-900">
            {user.company?.length ?? 0}
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Email
          </p>
          <p className="mt-2 text-sm font-medium break-all text-gray-900">
            {user.email || "No informado"}
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold tracking-tight text-gray-900">
              Datos principales
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Información básica de tu cuenta.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <CircleUserRound size={16} strokeWidth={1.5} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Nombre completo
                </p>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-900">
                {fullName || "No informado"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Mail size={16} strokeWidth={1.5} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Email
                </p>
              </div>
              <p className="mt-3 text-sm font-medium break-all text-gray-900">
                {user.email || "No informado"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Hash size={16} strokeWidth={1.5} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Número vendedor NIC
                </p>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-900">
                {user.numberSaleNic ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Hash size={16} strokeWidth={1.5} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Número vendedor Liess
                </p>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-900">
                {user.numberSaleLiess ?? 0}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold tracking-tight text-gray-900">
                Compañías
              </h2>
            </div>

            <div className="flex flex-wrap gap-2 p-6">
              {user.company?.length ? (
                user.company.map((company: string) => (
                  <span
                    key={company}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                  >
                    <Building2 size={12} strokeWidth={1.5} />
                    {company}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">Sin compañías asignadas</p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <KeyRound size={16} strokeWidth={1.5} className="text-gray-700" />
                <h2 className="text-base font-semibold tracking-tight text-gray-900">
                  Cambiar contraseña
                </h2>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Ingresá la nueva contraseña dos veces para confirmarla.
              </p>
            </div>

            <form className="space-y-5 p-6">
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
                >
                  Nueva contraseña
                </label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
                >
                  Confirmar nueva contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-900"
              >
                Actualizar contraseña
              </button>
            </form>
          </section>
        </section>
      </section>
    </div>
  );
}
