import mongoose, { Document, Schema } from "mongoose";

export interface IEmpresaGasto extends Document {
  cuit: string;
  nombre: string;
  createdAt: Date;
  updatedAt: Date;
}

const empresaGastoSchema = new Schema<IEmpresaGasto>(
  {
    cuit: { type: String, required: true, unique: true, trim: true, match: /^\d{11}$/ },
    nombre: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: "empresas_gastos" },
);

export default mongoose.model<IEmpresaGasto>("empresas_gastos", empresaGastoSchema);
