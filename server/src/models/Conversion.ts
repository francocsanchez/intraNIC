import mongoose, { Document, Schema } from "mongoose";

export interface IConversion extends Document {
  tipoConversion: string;
  proveedor: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversionSchema = new Schema<IConversion>(
  {
    tipoConversion: { type: String, required: true, trim: true },
    proveedor: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

conversionSchema.index(
  { tipoConversion: 1, proveedor: 1 },
  { unique: true, collation: { locale: "es", strength: 2 } },
);

export default mongoose.model<IConversion>("conversiones", conversionSchema);
