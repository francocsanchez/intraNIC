import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRendicionGastoItem {
  fecha: Date;
  empresaNombre: string;
  empresaCuit: string;
  descripcion: string;
  montoCentavos: number;
}

export interface IRendicionGasto extends Document {
  createdBy: Types.ObjectId;
  motivo: string;
  montoRetiradoCentavos: number;
  gastos: IRendicionGastoItem[];
  createdAt: Date;
  updatedAt: Date;
}

const gastoSchema = new Schema<IRendicionGastoItem>(
  {
    fecha: { type: Date, required: true },
    empresaNombre: { type: String, required: true, trim: true },
    empresaCuit: { type: String, required: true, trim: true, match: /^\d{11}$/ },
    descripcion: { type: String, required: true, trim: true },
    montoCentavos: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const rendicionGastoSchema = new Schema<IRendicionGasto>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    motivo: { type: String, required: true, trim: true },
    montoRetiradoCentavos: { type: Number, required: true, min: 0, default: 0 },
    gastos: {
      type: [gastoSchema],
      required: true,
      validate: {
        validator: (value: IRendicionGastoItem[]) => Array.isArray(value) && value.length > 0,
        message: "Debes ingresar al menos un gasto",
      },
    },
  },
  { timestamps: true, collection: "rendiciones_gastos" },
);

rendicionGastoSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model<IRendicionGasto>("rendiciones_gastos", rendicionGastoSchema);
