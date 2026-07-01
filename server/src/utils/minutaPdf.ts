import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { generatePdfFromHtml } from "../pdf/playwrightPdf";
import {
  renderMinutaPdfFooterTemplate,
  renderMinutaPdfHeaderTemplate,
  renderMinutaPdfHtml,
} from "../pdf/minutas/minutaPdfTemplate";
import { buildMinutaPdfViewModel } from "../pdf/minutas/minutaPdfViewModel";

type MinutaPdfUser = {
  _id: string;
  name: string;
  lastName: string;
};

type MinutaPdfTemario = {
  orden: number;
  nombre: string;
  desarrollo: string;
};

export type MinutaPdfPayload = {
  _id: string;
  fecha: string;
  fechaLabel: string;
  tema: string;
  moderador: MinutaPdfUser;
  participantes: MinutaPdfUser[];
  temario: MinutaPdfTemario[];
};

const resolveMinutaPdfCssPath = () => {
  const runtimePath = path.resolve(__dirname, "..", "pdf", "minutas", "minutaPdfStyles.css");

  if (fsSync.existsSync(runtimePath)) {
    return runtimePath;
  }

  const serverRoot =
    path.basename(process.cwd()).toLowerCase() === "server"
      ? process.cwd()
      : path.resolve(process.cwd(), "server");

  const sourcePath = path.resolve(serverRoot, "src", "pdf", "minutas", "minutaPdfStyles.css");

  if (fsSync.existsSync(sourcePath)) {
    return sourcePath;
  }

  return runtimePath;
};

export const generateMinutaPdfBuffer = async (payload: MinutaPdfPayload) => {
  const [css, viewModel] = await Promise.all([
    fs.readFile(resolveMinutaPdfCssPath(), "utf8"),
    buildMinutaPdfViewModel(payload),
  ]);

  const html = renderMinutaPdfHtml(viewModel, css);

  return generatePdfFromHtml(html, {
    footerTemplate: renderMinutaPdfFooterTemplate(viewModel),
    format: "A4",
    headerTemplate: renderMinutaPdfHeaderTemplate(viewModel),
    margin: {
      top: "22mm",
      right: "14mm",
      bottom: "18mm",
      left: "14mm",
    },
  });
};
