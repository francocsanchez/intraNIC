import fs from "fs/promises";
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

const minutaPdfCssPath = path.resolve(
  path.basename(process.cwd()).toLowerCase() === "server" ? process.cwd() : path.resolve(process.cwd(), "server"),
  "src",
  "pdf",
  "minutas",
  "minutaPdfStyles.css",
);

export const generateMinutaPdfBuffer = async (payload: MinutaPdfPayload) => {
  const [css, viewModel] = await Promise.all([
    fs.readFile(minutaPdfCssPath, "utf8"),
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
