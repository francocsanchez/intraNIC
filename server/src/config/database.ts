import colors from "colors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();
const separator = colors.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const createMssqlConnection = (database: string, username: string, password: string, host: string) => {
  return new Sequelize(database, username, password, {
    host,
    dialect: "mssql",
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
};

export const sequelizeNIC = createMssqlConnection(
  process.env.DATABASE_NIC!,
  process.env.DBUSER_NIC!,
  process.env.DBPASS_NIC!,
  process.env.DBHOST_NIC!,
);

export const sequelizeLIESS = createMssqlConnection(
  process.env.DATABASE_LIESS!,
  process.env.DBUSER_LIESS!,
  process.env.DBPASS_LIESS!,
  process.env.DBHOST_LIESS!,
);

export const authenticateSQL = async (sequelize: Sequelize, name: string) => {
  try {
    await sequelize.authenticate();
    console.log("\n" + colors.bgBlue.white.bold(" 🗄️  SQL SERVER "));
    console.log(separator);
    console.log(`${colors.yellow("📡 DB:")} ${colors.white(name)}`);
    console.log(`${colors.yellow("📊 Estado:")} ${colors.green("Conectado")}`);
    console.log(separator);
  } catch (error) {
    console.log("\n" + colors.bgRed.white.bold(" ERROR SQL SERVER "));
    console.log(separator);
    console.log(`${colors.yellow("📡 DB:")} ${colors.white(name)}`);
    console.log(`${colors.yellow("📊 Estado:")} ${colors.red("Error de conexión")}`);
    console.log(separator);
    console.error(colors.gray(error));
  }
};

export const connectMongo = async () => {
  try {
    const connection = await mongoose.connect(process.env.DATABASE_MONGO!);
    console.log("\n" + colors.bgGreen.white.bold(" 🍃 MONGODB "));
    console.log(separator);
    console.log(`${colors.yellow("🌐 Host:")} ${colors.white(`${connection.connection.host}:${connection.connection.port}`)}`);
    console.log(`${colors.yellow("📊 Estado:")} ${colors.green("Conectado")}`);
    console.log(separator);
  } catch (error) {
    console.log("\n" + colors.bgRed.white.bold(" ERROR MONGODB "));
    console.log(separator);
    console.log(`${colors.yellow("📊 Estado:")} ${colors.red("Error de conexión")}`);
    console.log(separator);
    console.error(colors.gray(error));
    process.exit(1);
  }
};

export const connectDatabases = async () => {
  await authenticateSQL(sequelizeNIC, "NIPPON CAR");
  await authenticateSQL(sequelizeLIESS, "LIESS");
  await connectMongo();
};
