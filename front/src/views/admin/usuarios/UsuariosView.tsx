import { getVendedoresNic } from "@/api/dms/dmsAPI";
import { changeStatusUsuario, getUsuarios, resetPasswordUserByID } from "@/api/usuarioAPI";
import { hasModuleAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import type { Usuario, Vendedor } from "@/types/index";
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

function getResponseMessage(response: unknown, fallback: string) {
  if (
    response &&
    typeof response === "object" &&
    "message" in response &&
    typeof (response as { message?: unknown }).message === "string"
  ) {
    return (response as { message: string }).message;
  }

  return fallback;
}

export default function UsuariosView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManageUsers = hasModuleAccess(user, "usuarios");
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [visibleSection, setVisibleSection] = useState<"habilitados" | "deshabilitados">("habilitados");

  const { data, isError, isLoading } = useQuery<Usuario[] | undefined>({
    queryKey: ["usuarios", "listar"],
    queryFn: getUsuarios,
  });

  const { data: vendedoresData } = useQuery<{ data: Vendedor[] }>({
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
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Error al cambiar el estado del usuario");
    },
    onSuccess: (response: unknown) => {
      toast.success(getResponseMessage(response, "Estado del usuario actualizado"));
      queryClient.invalidateQueries({ queryKey: ["usuarios", "listar"] });
    },
  });

  const { mutate: resetPasswordUser } = useMutation({
    mutationFn: (id: string) => resetPasswordUserByID(id),
    onMutate: (id: string) => {
      setResettingUserId(id);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Error al enviar la nueva contrasena");
    },
    onSuccess: (response: unknown) => {
      toast.success(getResponseMessage(response, "Nueva contrasena enviada correctamente"));
      queryClient.invalidateQueries({ queryKey: ["usuarios", "listar"] });
    },
    onSettled: () => {
      setResettingUserId(null);
    },
  });

  const usuarios = (data ?? []) as Usuario[];

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
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm text-red-600">
          Error al cargar los usuarios
        </div>
      </div>
    );
  }

  const usuariosHabilitados = usuarios.filter((u) => u.enable);
  const usuariosDeshabilitados = usuarios.filter((u) => !u.enable);
  const activos = usuariosHabilitados.length;
  const deshabilitados = usuariosDeshabilitados.length;
  const usuariosVisibles = visibleSection === "habilitados" ? usuariosHabilitados : usuariosDeshabilitados;

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administracion</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Usuarios</h1>
        </div>

        {canManageUsers ? (
          <Link
            to={paths.admin.crearUsuario}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-900"
          >
            Crear usuario
          </Link>
        ) : null}
      </section>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Lista de usuarios</h2>
            <p className="mt-1 text-sm text-gray-500">
              {visibleSection === "habilitados"
                ? "Vista limpia con solo usuarios habilitados."
                : "Listado separado de usuarios deshabilitados."}
            </p>
          </div>

          <div className="inline-flex w-full rounded-lg bg-gray-100 p-1 md:w-auto">
            <button
              type="button"
              onClick={() => setVisibleSection("habilitados")}
              className={[
                "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                visibleSection === "habilitados" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              Habilitados ({activos})
            </button>

            <button
              type="button"
              onClick={() => setVisibleSection("deshabilitados")}
              className={[
                "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                visibleSection === "deshabilitados"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              Deshabilitados ({deshabilitados})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Usuario</th>
                <th className="px-6 py-3 text-left">Rol</th>
                <th className="px-6 py-3 text-left">Sucursal entrega</th>
                <th className="px-6 py-3 text-left">Celular</th>
                <th className="px-6 py-3 text-left">NIC</th>
                <th className="px-6 py-3 text-left">LIESS</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {usuariosVisibles.map((u) => (
                <tr key={u.email} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">
                      {capitalize(u.lastName)}, {capitalize(u.name)}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">{u.email}</div>
                  </td>

                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                      {u.role.map((r) => (
                        <span
                          key={r}
                          className="rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-3 text-gray-700">
                    {u.sucursalEntrega?.nombre ?? "-"}
                  </td>

                  <td className="px-6 py-3 text-gray-700">{u.celular || "-"}</td>

                  <td className="px-6 py-3 text-gray-700">
                    {u.numberSaleNic ? (vendedoresMap[u.numberSaleNic] ?? u.numberSaleNic) : "-"}
                  </td>

                  <td className="px-6 py-3 text-gray-700">
                    {u.numberSaleLiess ? (vendedoresMap[u.numberSaleLiess] ?? u.numberSaleLiess) : "-"}
                  </td>

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
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                          >
                            <RotateCcw size={14} strokeWidth={1.8} />
                            {resettingUserId === u._id ? "Enviando..." : "Enviar nueva pass"}
                          </button>

                          <Link
                            to={paths.admin.editarUsuario(u._id)}
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

              {usuariosVisibles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                    {visibleSection === "habilitados"
                      ? "No hay usuarios habilitados para mostrar."
                      : "No hay usuarios deshabilitados para mostrar."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
