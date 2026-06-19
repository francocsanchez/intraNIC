import mongoose, { Document, Schema, Types } from "mongoose";

export type TestDriveNegocio = "convencional" | "planAhorro";

export interface ITestDrive extends Document {
  dominio: string;
  modelo: string;
  version: Types.ObjectId;
  chasis: string;
  color: Types.ObjectId;
  negocio: TestDriveNegocio;
  anio: number;
  permiteStarlink: boolean;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const testDriveSchema = new Schema<ITestDrive>(
  {
    dominio: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    modelo: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: Schema.Types.ObjectId,
      ref: "versiones",
      required: true,
    },
    chasis: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    color: {
      type: Schema.Types.ObjectId,
      ref: "colores",
      required: true,
    },
    negocio: {
      type: String,
      enum: ["convencional", "planAhorro"],
      required: true,
    },
    anio: {
      type: Number,
      required: true,
    },
    permiteStarlink: {
      type: Boolean,
      default: false,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "test_drivers" },
);

testDriveSchema.index({ dominio: 1 }, { unique: true });
testDriveSchema.index({ chasis: 1 }, { unique: true });

const TestDrive = mongoose.model<ITestDrive>("test_drivers", testDriveSchema);

export default TestDrive;
