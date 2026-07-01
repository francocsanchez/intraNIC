type MinutaMailTemplateData = {
  fechaLabel: string;
  moderador: string;
  tema: string;
  toName: string;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const buildMinutaMailTemplate = ({
  fechaLabel,
  moderador,
  tema,
  toName,
}: MinutaMailTemplateData) => `
  <!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Envio de minuta interna</title>
    </head>
    <body style="margin:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f7;padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #dbe2ea;border-radius:18px;overflow:hidden;">
              <tr>
                <td style="background:#0f172a;padding:24px 28px;">
                  <p style="margin:0;color:#cbd5e1;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">IntraNIC</p>
                  <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;line-height:1.2;">Minuta interna adjunta</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Hola ${escapeHtml(toName)},</p>
                  <p style="margin:0 0 20px;font-size:14px;line-height:1.8;color:#334155;">
                    Te enviamos adjunta la minuta de la reunión realizada el día
                    <strong>${escapeHtml(fechaLabel)}</strong>.
                  </p>

                  <div style="margin:0 0 22px;padding:18px 20px;border:1px solid #dbe2ea;border-radius:14px;background:#f8fafc;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">Tema</p>
                    <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(tema)}</p>

                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">Moderador</p>
                    <p style="margin:0;font-size:14px;color:#0f172a;">${escapeHtml(moderador)}</p>
                  </div>

                  <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:#475569;">
                    El archivo PDF queda adjunto en este correo para su consulta o reenvío.
                  </p>
                  <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">
                    Este mensaje fue generado automáticamente por el sistema.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;
