import nodemailer from "nodemailer";

type PasswordResetEmailData = {
  to: string;
  name: string;
  temporaryPassword: string;
};

const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta configurar ${name}`);
  }

  return value;
};

const getTransporter = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";

  return nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port,
    secure,
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });
};

const buildPasswordResetTemplate = ({ name, temporaryPassword }: PasswordResetEmailData) => {
  const appName = process.env.MAIL_APP_NAME || "IntraNIC";

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Recuperacion de contrasena</title>
      </head>
      <body style="margin:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="background:#111827;padding:24px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.02em;">${appName}</p>
                    <p style="margin:6px 0 0;color:#d1d5db;font-size:13px;">Recuperacion de contrasena</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <p style="margin:0 0 14px;font-size:16px;line-height:1.5;">Hola ${name},</p>
                    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
                      Generamos una nueva contrasena para tu usuario. Usala para ingresar al sistema y luego cambiala desde tu perfil.
                    </p>
                    <div style="margin:24px 0;padding:18px;border:1px solid #d1d5db;border-radius:12px;background:#f3f4f6;text-align:center;">
                      <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.16em;font-weight:700;">Nueva contrasena</p>
                      <p style="margin:0;color:#111827;font-size:28px;font-weight:700;letter-spacing:.14em;">${temporaryPassword}</p>
                    </div>
                    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">
                      Si no solicitaste este cambio, comunicate con un administrador del sistema.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px;background:#f3f4f6;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
                    Este mensaje fue enviado automaticamente por ${appName}.
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

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  const fromEmail = getRequiredEnv("SMTP_FROM_EMAIL");
  const fromName = process.env.SMTP_FROM_NAME || process.env.MAIL_APP_NAME || "IntraNIC";
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: data.to,
    subject: "Nueva contrasena de acceso",
    html: buildPasswordResetTemplate(data),
  });
}
