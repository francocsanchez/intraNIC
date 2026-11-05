import { isAxiosError } from "axios";
import api from "@/libs/axios";
import {
  linkResponseSchema,
  linkDeleteResponseSchema,
  linksListResponseSchema,
  type LinkResponse,
  type LinksListResponse,
} from "@/types/index";

export type LinkPayload = { url: string; descripcion: string };

const errorMessage = (error: unknown, fallback: string) =>
  isAxiosError(error) ? error.response?.data?.error || error.response?.data?.message || fallback : fallback;

async function parse<T>(
  promise: Promise<{ data: unknown }>,
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } },
  fallback: string,
): Promise<T> {
  try {
    const { data } = await promise;
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new Error("La respuesta del servidor no tiene el formato esperado");
    return parsed.data;
  } catch (error) {
    if (error instanceof Error && error.message.includes("formato esperado")) throw error;
    throw new Error(errorMessage(error, fallback));
  }
}

export const getLinks = (): Promise<LinksListResponse> =>
  parse(api.get("/links"), linksListResponseSchema, "No se pudieron cargar los links");

export const createLink = (payload: LinkPayload): Promise<LinkResponse> =>
  parse(api.post("/links", payload), linkResponseSchema, "No se pudo crear el link");

export const updateLink = (id: string, payload: LinkPayload): Promise<LinkResponse> =>
  parse(api.patch(`/links/${id}`, payload), linkResponseSchema, "No se pudo actualizar el link");

export const deleteLink = (id: string): Promise<{ message: string }> =>
  parse(api.delete(`/links/${id}`), linkDeleteResponseSchema, "No se pudo eliminar el link");
