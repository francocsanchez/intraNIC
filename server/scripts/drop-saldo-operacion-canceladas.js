const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const collectionName = "saldo_operacion_canceladas";

async function dropCollection() {
  if (!process.env.DATABASE_MONGO) {
    throw new Error("DATABASE_MONGO no esta configurada");
  }

  await mongoose.connect(process.env.DATABASE_MONGO);
  const database = mongoose.connection.db;
  if (!database) {
    throw new Error("No fue posible acceder a MongoDB");
  }

  const collections = await database.listCollections({ name: collectionName }).toArray();
  if (!collections.length) {
    console.log(`La coleccion ${collectionName} ya no existe.`);
    return;
  }

  await database.dropCollection(collectionName);
  console.log(`Coleccion ${collectionName} eliminada.`);
}

dropCollection()
  .catch((error) => {
    console.error("No fue posible eliminar saldo_operacion_canceladas", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
