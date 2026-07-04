import mongoose, { Document, Schema } from "mongoose";

export interface IAnalisisStockVersionDictionary extends Document {
  modelo: string;
  modeloKey: string;
  versionRaw: string;
  versionRawKey: string;
  versionCanonica: string;
  versionCanonicaKey: string;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const analisisStockVersionDictionarySchema = new Schema<IAnalisisStockVersionDictionary>(
  {
    modelo: {
      type: String,
      required: true,
      trim: true,
    },
    modeloKey: {
      type: String,
      required: true,
      trim: true,
    },
    versionRaw: {
      type: String,
      required: true,
      trim: true,
    },
    versionRawKey: {
      type: String,
      required: true,
      trim: true,
    },
    versionCanonica: {
      type: String,
      required: true,
      trim: true,
    },
    versionCanonicaKey: {
      type: String,
      required: true,
      trim: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

analisisStockVersionDictionarySchema.index({ modeloKey: 1, versionRawKey: 1 }, { unique: true });

const AnalisisStockVersionDictionary = mongoose.model<IAnalisisStockVersionDictionary>(
  "analisis_stock_version_dictionary",
  analisisStockVersionDictionarySchema,
);

export default AnalisisStockVersionDictionary;
