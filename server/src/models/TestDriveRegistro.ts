import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITestDriveRegistro extends Document {
  unidadId: Types.ObjectId;
  fechaSolicitado: Date;
  fechaRetiro: string;
  horaRetiro: string;
  fechaRegreso: string;
  horaRegreso: string;
  retiroAt: Date;
  regresoAt: Date;
  starlink: boolean;
  observacion: string;
  solicitadoPorId: string;
  solicitadoPorNombre: string;
  createdAt: Date;
  updatedAt: Date;
}

const testDriveRegistroSchema = new Schema<ITestDriveRegistro>(
  {
    unidadId: {
      type: Schema.Types.ObjectId,
      ref: "test_drivers",
      required: true,
      index: true,
    },
    fechaSolicitado: {
      type: Date,
      default: Date.now,
      required: true,
    },
    fechaRetiro: {
      type: String,
      required: true,
      trim: true,
    },
    horaRetiro: {
      type: String,
      required: true,
      trim: true,
    },
    fechaRegreso: {
      type: String,
      required: true,
      trim: true,
    },
    horaRegreso: {
      type: String,
      required: true,
      trim: true,
    },
    retiroAt: {
      type: Date,
      required: true,
      index: true,
    },
    regresoAt: {
      type: Date,
      required: true,
      index: true,
    },
    starlink: {
      type: Boolean,
      default: false,
    },
    observacion: {
      type: String,
      trim: true,
      default: "",
    },
    solicitadoPorId: {
      type: String,
      required: true,
      index: true,
    },
    solicitadoPorNombre: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true, collection: "test_drive_registros" },
);

testDriveRegistroSchema.index({ unidadId: 1, retiroAt: 1, regresoAt: 1 });

const TestDriveRegistro = mongoose.model<ITestDriveRegistro>(
  "test_drive_registros",
  testDriveRegistroSchema,
);

export default TestDriveRegistro;
