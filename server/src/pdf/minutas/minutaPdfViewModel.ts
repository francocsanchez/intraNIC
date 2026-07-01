import fs from "fs/promises";
import path from "path";
import { MinutaPdfPayload } from "../../utils/minutaPdf";

type MinutaPdfViewModelParticipant = {
  fullName: string;
  order: number;
};

type MinutaPdfViewModelTopic = {
  desarrollo: string;
  nombre: string;
  orden: number;
};

export type MinutaPdfViewModel = {
  fechaLabel: string;
  footerText: string;
  logoDataUri: string | null;
  moderador: string;
  participantes: MinutaPdfViewModelParticipant[];
  subtitle: string;
  tema: string;
  temario: Array<{
    descripcion: string;
    orden: number;
  }>;
  titulo: string;
  topics: MinutaPdfViewModelTopic[];
  toyotaDataUri: string | null;
};

const serverRoot =
  path.basename(process.cwd()).toLowerCase() === "server"
    ? process.cwd()
    : path.resolve(process.cwd(), "server");

const repoRoot =
  path.basename(process.cwd()).toLowerCase() === "server"
    ? path.resolve(process.cwd(), "..")
    : process.cwd();

const LOGO_PATH = path.resolve(
  serverRoot,
  "assets",
  "proformas",
  "logo-nipponcar-negro.png",
);

const TOYOTA_PATH = path.resolve(repoRoot, "front", "public", "toyota.svg");

const buildPngDataUri = async (assetPath: string) => {
  try {
    const content = await fs.readFile(assetPath);
    return `data:image/png;base64,${content.toString("base64")}`;
  } catch {
    return null;
  }
};

const buildSvgDataUri = async (assetPath: string) => {
  try {
    const content = await fs.readFile(assetPath, "utf8");
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;
  } catch {
    return null;
  }
};

const toUpper = (value: string) => value.toLocaleUpperCase("es-AR");

export const buildMinutaPdfViewModel = async (
  payload: MinutaPdfPayload,
): Promise<MinutaPdfViewModel> => {
  const [logoDataUri, toyotaDataUri] = await Promise.all([
    buildPngDataUri(LOGO_PATH),
    buildSvgDataUri(TOYOTA_PATH),
  ]);

  return {
    fechaLabel: payload.fechaLabel,
    footerText: "Uso interno de Nippon Car SRL",
    logoDataUri,
    moderador: toUpper(`${payload.moderador.lastName}, ${payload.moderador.name}`),
    participantes: payload.participantes.map((participant, index) => ({
      fullName: toUpper(`${participant.lastName}, ${participant.name}`),
      order: index + 1,
    })),
    subtitle: "Documento interno de coordinación comercial",
    tema: payload.tema,
    temario: payload.temario.map((topic) => ({
      descripcion: topic.nombre,
      orden: topic.orden,
    })),
    titulo: "MINUTA INTERNA",
    topics: payload.temario.map((topic) => ({
      desarrollo: topic.desarrollo,
      nombre: topic.nombre,
      orden: topic.orden,
    })),
    toyotaDataUri,
  };
};
