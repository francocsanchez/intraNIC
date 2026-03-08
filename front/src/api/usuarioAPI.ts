import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { usuarioSchema, usuariosResponseSchema, type Usuario } from "../types";
import type { UsuarioFormData } from "@/views/admin/usuarios/CrearUsuarioView";

export async function getUsuarios() {
  try {
    const { data } = await api("/usuarios");

    const response = usuariosResponseSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getUsuarios:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    if (response.success) {
      return response.data;
    }
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export async function changeStatusUsuario(idUsuario: Usuario["_id"]) {
  try {
    const { data } = await api.patch(`/usuarios/${idUsuario}/change-status`);

    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export async function createUsuario(formData: UsuarioFormData) {
  try {
    const { data } = await api.post(`/usuarios`, formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export async function getUsuarioById(idUsuario: Usuario["_id"]) {
  try {
    const { data } = await api.get(`/usuarios/${idUsuario}`);

    const response = usuarioSchema.safeParse(data.data);
    if (!response.success) {
      console.error(
        "Error en la validación de getUsuarioById:",
        response.error,
      );
      throw new Error("La estructura de los datos es inválida");
    }

    if (response.success) {
      return response.data;
    }

    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

type UsuarioAPIType = {
  formData: UsuarioFormData;
  usuarioId: Usuario["_id"];
};

export async function updateUsuarioById({
  formData,
  usuarioId,
}: UsuarioAPIType) {
  try {
    const { data } = await api.put(`/usuarios/${usuarioId}`, formData);

    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}
