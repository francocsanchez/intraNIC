import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

type ProformaExportPayload = {
  numeroProforma: number;
  fechaLabel: string;
  listaPrecioLabel: string;
  senores: string;
  cliente: string;
  cuit: string;
  observaciones: string;
  asesorComercial: string;
  emailAsesor: string;
  totalNeto: number;
  unidades: Array<{
    rows: Array<{
      detalle: string;
      cantidad: number;
      iva: number;
      neto: number;
      total: number;
      totales: number;
    }>;
  }>;
};

const bundledPythonPath = path.resolve(
  process.env.USERPROFILE || "",
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  "python.exe",
);

const resolvePythonExecutable = async () => {
  const explicit = process.env.PROFORMA_PYTHON_PATH || process.env.PYTHON_PATH;
  if (explicit) return explicit;

  try {
    await fs.access(bundledPythonPath);
    return bundledPythonPath;
  } catch {
    return process.platform === "win32" ? "python" : "python3";
  }
};

export const generateProformaPdfBuffer = async (payload: ProformaExportPayload) => {
  const pythonExecutable = await resolvePythonExecutable();
  const scriptPath = path.resolve(__dirname, "../../scripts/generate_proforma_pdf.py");
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "proforma-"));
  const inputPath = path.join(tempDir, "input.json");
  const outputPath = path.join(tempDir, "proforma.pdf");

  await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(pythonExecutable, [scriptPath, inputPath, outputPath], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stderr = "";
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", (error) => reject(error));
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(stderr || "No se pudo generar el PDF"));
      });
    });

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};
