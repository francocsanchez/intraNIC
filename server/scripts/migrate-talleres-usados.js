/* Read-only migration from the retired intra_talleres database. Re-running is safe. */
require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const sourceUri = process.env.TALLERES_MONGO_URI;
const targetUri = process.env.DATABASE_MONGO;
if (!sourceUri || !targetUri) {
  throw new Error("Definí TALLERES_MONGO_URI y DATABASE_MONGO antes de migrar.");
}

const normalize = (value) => String(value || "").trim().toLocaleLowerCase();
const asDate = (value) => value ? new Date(value) : null;

async function run() {
  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);
  await Promise.all([sourceClient.connect(), targetClient.connect()]);
  try {
    const source = sourceClient.db();
    const target = targetClient.db();
    const sourceTalleres = await source.collection("tallers").find({}).toArray();
    const sourcePresupuestos = await source.collection("presupuestos").find({}).toArray();
    const talleres = target.collection("usados_talleres");
    const presupuestos = target.collection("usados_presupuestos");
    let talleresMigrados = 0;
    let presupuestosMigrados = 0;
    let omitidos = 0;

    for (const item of sourceTalleres) {
      const legacySourceId = String(item._id);
      const nombre = String(item.nombre || "").trim();
      if (!nombre) { omitidos++; continue; }
      const result = await talleres.updateOne(
        { legacySourceId },
        { $setOnInsert: { _id: new ObjectId(), legacySourceId, nombre, nombreNormalizado: normalize(nombre), tipoTrabajo: String(item.tipoTrabajo || "").trim(), activo: item.activo !== false, createdAt: asDate(item.createdAt) || new Date(), updatedAt: asDate(item.updatedAt) || new Date() } },
        { upsert: true },
      );
      if (result.upsertedCount) talleresMigrados++;
    }

    const targetTalleres = await talleres.find({ legacySourceId: { $exists: true } }).toArray();
    const tallerIdByLegacy = new Map(targetTalleres.map((item) => [item.legacySourceId, item._id]));
    for (const item of sourcePresupuestos) {
      const legacySourceId = String(item._id);
      const tallerId = tallerIdByLegacy.get(String(item.tallerId || ""));
      if (!tallerId || !item.dominio || !item.marca || !item.modelo) { omitidos++; continue; }
      const valorInfo = Number(item.valorInfo || 0);
      const porcentajeToma = Number(item.porcentajeToma || 0);
      const valorIngreso = Number.isFinite(Number(item.valorIngreso)) ? Number(item.valorIngreso) : valorInfo - valorInfo * porcentajeToma / 100;
      const costo = Number(item.costo || 0);
      const result = await presupuestos.updateOne(
        { legacySourceId },
        { $setOnInsert: { _id: new ObjectId(), legacySourceId, interno: String(item.interno || ""), esExterno: Boolean(item.esExterno), esReingreso: Boolean(item.esReingreso), dominio: String(item.dominio).trim(), marca: String(item.marca).trim(), modelo: String(item.modelo).trim(), km: Number(item.km || 0), costo, costoConIva: Number.isFinite(Number(item.costoConIva)) ? Number(item.costoConIva) : Math.round(costo * 1.21 * 100) / 100, valorInfo, porcentajeToma, valorIngreso, diferencia: Number.isFinite(Number(item.diferencia)) ? Number(item.diferencia) : valorInfo - valorIngreso, observaciones: String(item.observaciones || "").trim(), estado: ["Pendiente", "Aprobado", "Rechazado", "Revisar"].includes(item.estado) ? item.estado : "Pendiente", tallerId, tallerNombre: String(item.tallerNombre || "").trim(), nroPresupuesto: String(item.nroPresupuesto || "").trim(), prioridad: ["Alta", "Media", "Baja"].includes(item.prioridad) ? item.prioridad : "Media", detalle: String(item.detalle || "").trim(), fechaPedido: asDate(item.fechaPedido) || asDate(item.createdAt) || new Date(), fechaIngresoTaller: asDate(item.fechaIngresoTaller), fechaEgresoTaller: asDate(item.fechaEgresoTaller), createdAt: asDate(item.createdAt) || new Date(), updatedAt: asDate(item.updatedAt) || new Date() } },
        { upsert: true },
      );
      if (result.upsertedCount) presupuestosMigrados++;
    }
    console.log(JSON.stringify({ source: { talleres: sourceTalleres.length, presupuestos: sourcePresupuestos.length }, inserted: { talleres: talleresMigrados, presupuestos: presupuestosMigrados }, omitted: omitidos }, null, 2));
  } finally { await Promise.all([sourceClient.close(), targetClient.close()]); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
