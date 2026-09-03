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
      <div className="font-preset w-full px-2 py-3">
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">Cargando usuarios...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-preset w-full px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm text-destructive">
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
    <div className="font-preset w-full space-y-3 px-2 py-3">
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Administracion</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Usuarios</h1>
        </div>

        {canManageUsers ? (
          <Link
            to={paths.admin.crearUsuario}
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:opacity-90"
          >
            Crear usuario
          </Link>
        ) : null}
      </section>
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Lista de usuarios</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {visibleSection === "habilitados"
                ? "Vista limpia con solo usuarios habilitados."
                : "Listado separado de usuarios deshabilitados."}
            </p>
          </div>

          <div className="inline-flex w-full rounded-md bg-muted p-1 md:w-auto">
            <button
              type="button"
              onClick={() => setVisibleSection("habilitados")}
              className={[
                "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                visibleSection === "habilitados" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
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
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Deshabilitados ({deshabilitados})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">Usuario</th>
                <th className="px-3 py-3 text-left">Rol</th>
                <th className="px-3 py-3 text-left">Unidad negocio</th>
                <th className="px-3 py-3 text-left">Sucursal predeterminada</th>
                <th className="px-3 py-3 text-left">Celular</th>
                <th className="px-3 py-3 text-left">NIC</th>
                <th className="px-3 py-3 text-left">LIESS</th>
                <th className="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {usuariosVisibles.map((u) => (
                <tr key={u.email} className="hover:bg-muted">
                  <td className="px-3 py-3">
                    <div className="font-medium text-foreground">
                      {capitalize(u.lastName)}, {capitalize(u.name)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{u.email}</div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {u.role.map((r) => (
                        <span
                          key={r}
                          className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-3 py-3 text-foreground">
                    {u.unidadNegocio?.nombre ?? "-"}
                  </td>

                  <td className="px-3 py-3 text-foreground">
                    {u.sucursalPredeterminada?.nombre ?? "-"}
                  </td>

                  <td className="px-3 py-3 text-foreground">{u.celular || "-"}</td>

                  <td className="px-3 py-3 text-foreground">
                    {u.numberSaleNic ? (vendedoresMap[u.numberSaleNic] ?? u.numberSaleNic) : "-"}
                  </td>

                  <td className="px-3 py-3 text-foreground">
                    {u.numberSaleLiess ? (vendedoresMap[u.numberSaleLiess] ?? u.numberSaleLiess) : "-"}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      {canManageUsers ? (
                        <>
                          <button
                            type="button"
                            onClick={() => changeStatus(u._id)}
                            className={[
                              "inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                              u.enable
                                ? "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                                : "border border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                            ].join(" ")}
                          >
                            {u.enable ? "Deshabilitar" : "Habilitar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => resetPasswordUser(u._id)}
                            disabled={resettingUserId === u._id}
                            className="inline-flex items-center justify-center gap-1 rounded-md border border-amber-500/30 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                          >
                            <RotateCcw size={14} strokeWidth={1.8} />
                            {resettingUserId === u._id ? "Enviando..." : "Enviar nueva pass"}
                          </button>

                          <Link
                            to={paths.admin.editarUsuario(u._id)}
                            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
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
                  <td colSpan={8} className="px-3 py-10 text-center text-sm text-muted-foreground">
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
