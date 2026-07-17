type AgendaEntregaMailTemplateData = {
  sucursal: string;
  fecha: string;
  totalTurnos: number;
};

export const buildAgendaEntregaMailTemplate = ({
  sucursal,
  fecha,
  totalTurnos,
}: AgendaEntregaMailTemplateData) => `
  <!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Agenda de entrega</title>
    </head>
    <body style="margin:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
              <tr>
                <td style="background:#111827;padding:24px 28px;">
                  <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.02em;">IntraNIC</p>
                  <p style="margin:6px 0 0;color:#d1d5db;font-size:13px;">Agenda de entrega diaria</p>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.5;">Se adjunta la agenda de entrega del día.</p>
                  <div style="margin:24px 0;padding:18px;border:1px solid #d1d5db;border-radius:12px;background:#f3f4f6;">
                    <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.16em;font-weight:700;">Sucursal</p>
                    <p style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:700;">${sucursal}</p>
                    <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.16em;font-weight:700;">Fecha</p>
                    <p style="margin:0 0 16px;color:#111827;font-size:16px;font-weight:700;">${fecha}</p>
                    <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.16em;font-weight:700;">Registros</p>
                    <p style="margin:0;color:#111827;font-size:16px;font-weight:700;">${totalTurnos}</p>
                  </div>
                  <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">
                    El PDF de la agenda se encuentra adjunto en este correo.
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
