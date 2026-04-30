import { getVendedoresNic } from "@/api/dms/dmsAPI";
import { changeStatusUsuario, getUsuarios, resetPasswordUserByID } from "@/api/usuarioAPI";
import { useAuth } from "@/hooks/useAuthe";
import { hasAnyRole } from "@/helpers/access";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

function capitalize(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function UsuariosView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManageUsers = hasAnyRole(user, ["admin", "stock"]);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["usuarios", "listar"],
    queryFn: getUsuarios,
  });

  const { data: vendedoresData } = useQuery({
    queryKey: ["vendedores", "listar"],
    queryFn: getVendedoresNic,
  });

  const vendedoresMap = useMemo(() => {
    const vendedores = vendedoresData?.data ?? [];

    return vendedores.reduce((acc: Record<number, string>, vendedor) => {
      const codigo = Number(vendedor.codigo ?? 0);
      const nombre = vendedor.vendedor ?? "";

      if (codigo) {
        acc[codigo] = nombre;
      }

      return acc;
    }, {});
  }, [vendedoresData]);

  const { mutate: changeStatus } = useMutation({
    mutationFn: (id: string) => changeStatusUsuario(id),
    onError: (error: any) => {
      toast.error(error.message || "Error al cambiar el estado del usuario");
    },
    onSuccess: (response: any) => {
      toast.success(response.message || "Estado del usuario actualizado");
      queryClient.invalidateQueries({ queryKey: ["usuarios", "listar"] });
    },
  });

  const { mutate: resetPasswordUser } = useMutation({
    mutationFn: (id: string) => resetPasswordUserByID(id),
    onMutate: (id: string) => {
      setResettingUserId(id);
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al enviar la nueva contrasena");
    },
    onSuccess: (response: any) => {
      toast.success(response.message || "Nueva contrasena enviada correctamente");
      queryClient.invalidateQueries({ queryKey: ["usuarios", "listar"] });
    },
    onSettled: () => {
      setResettingUserId(null);
    },
  });

  const usuarios = data ?? [];

  if (isLoading) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Cargando usuarios...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm text-red-600">Error al cargar los usuarios</div>
      </div>
    );
  }

  const totalUsuarios = usuarios.length;
  const activos = usuarios.filter((u: any) => u.enable).length;

  const companyStats = usuarios.reduce((acc: Record<string, number>, u: any) => {
    u.company.forEach((company: string) => {
      acc[company] = (acc[company] || 0) + 1;
    });
    return acc;
  }, {});

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administración</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Usuarios</h1>
        </div>

        {canManageUsers ? (
          <Link
            to="/usuarios/crear"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-900"
          >
            Crear usuario
          </Link>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total usuarios</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{totalUsuarios}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Activos</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{activos}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Compañías</p>

          <div
            className="mt-3 grid divide-x divide-gray-200"
            style={{
              gridTemplateColumns: `repeat(${Math.max(Object.keys(companyStats).length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {Object.entries(companyStats).map(([company, total]) => (
              <div key={company} className="px-3 first:pl-0 last:pr-0">
                <p className="text-xs text-gray-500 uppercase">{company}</p>
                <p className="text-lg font-semibold text-gray-900">{total}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Lista de usuarios</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Usuario</th>
                <th className="px-6 py-3 text-left">Rol</th>
                <th className="px-6 py-3 text-left">Empresa</th>
                <th className="px-6 py-3 text-left">NIC</th>
                <th className="px-6 py-3 text-left">LIESS</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u: any) => (
                <tr key={u.email} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">
                      {capitalize(u.lastName)}, {capitalize(u.name)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{u.email}</div>
                  </td>

                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                      {u.role.map((r: string) => (
                        <span key={r} className="rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                      {u.company.map((c: string) => (
                        <span key={c} className="rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-3 text-gray-700">{u.numberSaleNic ? (vendedoresMap[u.numberSaleNic] ?? u.numberSaleNic) : "-"}</td>

                  <td className="px-6 py-3 text-gray-700">{u.numberSaleLiess ? (vendedoresMap[u.numberSaleLiess] ?? u.numberSaleLiess) : "-"}</td>

                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      {canManageUsers ? (
                        <>
                          <button
                            type="button"
                            onClick={() => changeStatus(u._id)}
                            className={[
                              "inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                              u.enable
                                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
                            ].join(" ")}
                          >
                            {u.enable ? "Deshabilitar" : "Habilitar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => resetPasswordUser(u._id)}
                            disabled={resettingUserId === u._id}
                            className="inline-flex items-center gap-1 justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                          >
                            <RotateCcw size={14} strokeWidth={1.8} />
                            {resettingUserId === u._id ? "Enviando..." : "Enviar nueva pass"}
                          </button>

                          <Link
                            to={`/usuarios/${u._id}/editar`}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                          >
                            Editar
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}

              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    No hay usuarios para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
