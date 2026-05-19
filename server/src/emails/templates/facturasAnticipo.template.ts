type FacturaAnticipoMailItem = {
  numeroOp: number;
  cliente: string;
  version: string;
  vendedor: string;
  chasis: string;
  fechaCarga: Date | string;
};

type FacturaAnticipoTemplateData = {
  nombreUsuario: string;
  operaciones: FacturaAnticipoMailItem[];
};

const formatDate = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  });
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const buildFacturasAnticipoTemplate = ({
  nombreUsuario,
  operaciones,
}: FacturaAnticipoTemplateData) => {
  const rows = operaciones
    .map(
      (operacion) => `
        <tr>
          <td style="padding:12px 10px;border-bottom:1px solid #d7e8ef;font-size:13px;color:#0f172a;">${escapeHtml(operacion.numeroOp)}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #d7e8ef;font-size:13px;color:#0f172a;">${escapeHtml(operacion.cliente)}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #d7e8ef;font-size:13px;color:#0f172a;">${escapeHtml(operacion.version)}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #d7e8ef;font-size:13px;color:#0f172a;">${escapeHtml(operacion.vendedor)}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #d7e8ef;font-size:13px;color:#0f172a;">${escapeHtml(operacion.chasis)}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #d7e8ef;font-size:13px;color:#0f172a;">${escapeHtml(formatDate(operacion.fechaCarga))}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Anulacion pendiente de facturas de anticipo</title>
      </head>
      <body style="margin:0;background:#e5e7eb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e5e7eb;padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:860px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d1d5db;">
                <tr>
                  <td style="background:#111827;padding:24px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">IntraNIC</p>
                    <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;line-height:1.2;">Anulacion pendiente de facturas de anticipo</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <div style="padding:18px;border-radius:14px;background:#f3f4f6;border:1px solid #d1d5db;">
                      <p style="margin:0 0 10px;font-size:16px;line-height:1.6;">Hola ${escapeHtml(nombreUsuario)},</p>
                      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
                        El sistema detecto que las siguientes operaciones cargadas por vos ya se encuentran facturadas.
                        Por favor, realiza la anulacion correspondiente de las facturas de anticipo.
                      </p>
                    </div>

                    <div style="margin-top:22px;overflow-x:auto;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;min-width:720px;border:1px solid #d1d5db;border-radius:12px;overflow:hidden;">
                        <thead>
                          <tr style="background:#f9fafb;">
                            <th align="left" style="padding:12px 10px;border-bottom:1px solid #d1d5db;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#111827;">Numero OP</th>
                            <th align="left" style="padding:12px 10px;border-bottom:1px solid #d1d5db;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#111827;">Cliente</th>
                            <th align="left" style="padding:12px 10px;border-bottom:1px solid #d1d5db;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#111827;">Version</th>
                            <th align="left" style="padding:12px 10px;border-bottom:1px solid #d1d5db;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#111827;">Vendedor</th>
                            <th align="left" style="padding:12px 10px;border-bottom:1px solid #d1d5db;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#111827;">Chasis</th>
                            <th align="left" style="padding:12px 10px;border-bottom:1px solid #d1d5db;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#111827;">Fecha de carga</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${rows}
                        </tbody>
                      </table>
                    </div>

                    <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#6b7280;">
                      Este aviso fue generado automaticamente por el sistema.
                    </p>
                    <p style="margin:6px 0 0;font-size:12px;line-height:1.7;color:#6b7280;">
                      No responder este correo.
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
};
