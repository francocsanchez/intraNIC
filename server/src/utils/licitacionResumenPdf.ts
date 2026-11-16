import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

const bundledPythonPath = path.resolve(process.env.USERPROFILE || "", ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe");

const resolvePythonExecutable = async () => {
  const explicit = process.env.LICITACION_PYTHON_PATH || process.env.PYTHON_PATH;
  if (explicit) return explicit;
  try { await fs.access(bundledPythonPath); return bundledPythonPath; }
  catch { return process.platform === "win32" ? "python" : "python3"; }
};

export const generateLicitacionResumenPdfBuffer = async (payload: unknown) => {
  const pythonExecutable = await resolvePythonExecutable();
  const scriptPath = path.resolve(__dirname, "../../scripts/generate_licitacion_resumen_pdf.py");
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "licitacion-resumen-"));
  const inputPath = path.join(tempDir, "input.json");
  const outputPath = path.join(tempDir, "licitacion-resumen.pdf");
  await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(pythonExecutable, [scriptPath, inputPath, outputPath], { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
      child.on("error", reject);
      child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr || "No se pudo generar el PDF")));
    });
    return await fs.readFile(outputPath);
  } finally { await fs.rm(tempDir, { recursive: true, force: true }); }
};
