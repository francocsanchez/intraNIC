import { MinutaPdfViewModel } from "./minutaPdfViewModel";
import { sanitizeRichTextHtml } from "../../utils/sanitizeHtml";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const renderMinutaPdfHtml = (viewModel: MinutaPdfViewModel, css: string) => {
  const participantsRows = viewModel.participantes
    .map(
      (participant) => `
        <tr>
          <td class="text-center">${participant.order}</td>
          <td>${escapeHtml(participant.fullName)}</td>
        </tr>
      `,
    )
    .join("");

  const temarioRows = viewModel.temario
    .map(
      (topic) => `
        <tr>
          <td class="text-center">${topic.orden}</td>
          <td>${escapeHtml(topic.descripcion)}</td>
        </tr>
      `,
    )
    .join("");

  const topicBlocks = viewModel.topics
    .map(
      (topic) => `
        <div class="development-line">
          <div class="development-index">[${topic.orden}]</div>
          <div class="rich-text-content">${sanitizeRichTextHtml(topic.desarrollo)}</div>
        </div>
      `,
    )
    .join("");

  return `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(viewModel.titulo)}</title>
      <style>${css}</style>
    </head>
    <body>
      <main class="page">
        <section class="hero">
          <div class="brand-row">
            <div class="brand-lockup">
              ${
                viewModel.logoDataUri
                  ? `<img src="${viewModel.logoDataUri}" alt="Nippon Car" class="brand-logo" />`
                  : `<div class="brand-fallback">NIPPON CAR</div>`
              }
            </div>
          </div>

          <div class="hero-card">
            <div>
              <div class="eyebrow">${escapeHtml(viewModel.subtitle)}</div>
              <h1>${escapeHtml(viewModel.titulo)}</h1>
            </div>
            <div class="hero-meta">
              <span class="hero-meta__label">Fecha</span>
              <span class="hero-meta__value">${escapeHtml(viewModel.fechaLabel)}</span>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-title">Tema</div>
          <div class="info-card info-card--theme">${escapeHtml(viewModel.tema)}</div>
        </section>

        <section class="section">
  <div class="section-title">Moderador</div>

  <table class="signature-table">
    <thead>
      <tr>
        <th colspan="2">Moderador</th>
      
      </tr>
    </thead>

    <tbody>
      <tr>
        <td colspan="2" class="moderador-name uppercase">
          ${escapeHtml(viewModel.moderador)}
        </td>
      </tr>
    </tbody>
  </table>
</section>

        <section class="section">
          <div class="section-title">Participantes</div>
          <table class="data-table">
            <thead>
              <tr>
                <th class="w-order">N°</th>
                <th>Nombre y apellido</th>
              </tr>
            </thead>
            <tbody class="uppercase">
              ${participantsRows}
            </tbody>
          </table>
        </section>

        <section class="section">
          <div class="section-title">Temario</div>
          <table class="data-table">
            <thead>
              <tr>
                <th class="w-order">Orden</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              ${temarioRows}
            </tbody>
          </table>
        </section>

        <section class="section section-flow">
          <div class="section-title">Desarrollo</div>
          <div class="development-text">
            ${topicBlocks}
          </div>
        </section>
      </main>
    </body>
  </html>`;
};

export const renderMinutaPdfHeaderTemplate = (viewModel: MinutaPdfViewModel) => `
  <div style="width: 100%; font-size: 8px; color: #4b5563; padding: 0 12mm; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: flex; width: 100%; justify-content: space-between; align-items: center; border-bottom: 1px solid #d1d5db; padding-bottom: 3px;">
      <span>Nippon Car</span>
      <span>${escapeHtml(viewModel.titulo)}</span>
      <span>${escapeHtml(viewModel.fechaLabel)}</span>
    </div>
  </div>
`;

export const renderMinutaPdfFooterTemplate = (viewModel: MinutaPdfViewModel) => `
  <div style="width: 100%; font-size: 8px; color: #6b7280; padding: 0 12mm; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: flex; width: 100%; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 3px;">
      <span>${escapeHtml(viewModel.footerText)}</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  </div>
`;
