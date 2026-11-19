/* Creates a local JSON backup before the one-way migration; it never changes MongoDB. */
require("dotenv").config();
const { MongoClient } = require("mongodb");
const { mkdir, writeFile } = require("node:fs/promises");
const { resolve } = require("node:path");

const uri = process.env.TALLERES_MONGO_URI;
if (!uri) throw new Error("Definí TALLERES_MONGO_URI antes de generar el backup.");
const outputDir = resolve(process.env.TALLERES_BACKUP_PATH || "./backups");

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const database = client.db();
    const [talleres, presupuestos] = await Promise.all([
      database.collection("tallers").find({}).toArray(),
      database.collection("presupuestos").find({}).toArray(),
    ]);
    await mkdir(outputDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const destination = resolve(outputDir, `intra-talleres-${stamp}.json`);
    await writeFile(destination, JSON.stringify({ generatedAt: new Date().toISOString(), talleres, presupuestos }, null, 2));
    console.log(JSON.stringify({ destination, talleres: talleres.length, presupuestos: presupuestos.length }, null, 2));
  } finally { await client.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
