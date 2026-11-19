/* Recreates 100 clearly marked visual-demo records. It never touches SIAC. */
require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.DATABASE_MONGO;
if (!uri) throw new Error("DATABASE_MONGO no está definida.");
const seed = "talleres-usados-100";
const now = new Date();
const workshops = ["DEMO · Taller Norte", "DEMO · Servicio Centro", "DEMO · Reparaciones Sur"];
const models = ["COROLLA XEI CVT", "YARIS XLS CVT", "HILUX SRX 4X4", "ETIOS XLS", "CRONOS DRIVE"];
const states = ["Pendiente", "Aprobado", "Rechazado", "Revisar"];

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db();
    const talleres = db.collection("usados_talleres");
    const presupuestos = db.collection("usados_presupuestos");
    await presupuestos.deleteMany({ demoSeed: seed });
    await talleres.deleteMany({ demoSeed: seed });
    const tallerDocs = workshops.map((nombre, index) => ({ _id: new ObjectId(), nombre, nombreNormalizado: nombre.toLowerCase(), tipoTrabajo: ["Mecánica", "Chapa y pintura", "Servicio integral"][index], activo: true, demoSeed: seed, createdAt: now, updatedAt: now }));
    await talleres.insertMany(tallerDocs);
    const records = Array.from({ length: 100 }, (_, index) => {
      const valorInfo = 2_000_000 + (index % 12) * 350_000;
      const porcentajeToma = [5, 10, 15, 20][index % 4];
      const valorIngreso = valorInfo * (1 - porcentajeToma / 100);
      const costo = index % 7 === 0 ? valorIngreso + 180_000 : 70_000 + (index % 9) * 45_000;
      const estado = states[index % states.length];
      const unitIndex = Math.floor(index / 3);
      const fechaPedido = new Date(2026, index % 11, 1 + ((index * 3) % 24));
      const diasReparacion = 2 + (index % 15);
      const taller = tallerDocs[index % tallerDocs.length];
      return { _id: new ObjectId(), demoSeed: seed, interno: "", esExterno: true, esReingreso: index % 3 > 0, dominio: `DEMO${String(unitIndex + 1).padStart(3, "0")}`, marca: "Demo", modelo: models[unitIndex % models.length], km: 5_000 + unitIndex * 1_250, costo, costoConIva: Math.round(costo * 1.21 * 100) / 100, valorInfo, porcentajeToma, valorIngreso, diferencia: valorInfo - valorIngreso, observaciones: "Registro de ejemplo para validar la interfaz.", estado, tallerId: taller._id, tallerNombre: taller.nombre, nroPresupuesto: `DEMO-${String(index + 1).padStart(3, "0")}`, prioridad: ["Alta", "Media", "Baja"][index % 3], detalle: "Presupuesto de demostración.", fechaPedido, fechaIngresoTaller: estado === "Aprobado" ? new Date(fechaPedido.getTime() + 86_400_000 * 2) : null, fechaEgresoTaller: estado === "Aprobado" && index % 3 !== 0 ? new Date(fechaPedido.getTime() + 86_400_000 * (2 + diasReparacion)) : null, createdAt: now, updatedAt: now };
    });
    await presupuestos.insertMany(records);
    console.log(JSON.stringify({ talleres: tallerDocs.length, presupuestos: records.length, seed }, null, 2));
  } finally { await client.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
