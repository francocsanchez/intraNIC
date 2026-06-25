import mongoose, { Document, Schema } from "mongoose";

export interface IImportedPatentamientoIdentifier extends Document {
  identificadorUnico: string;
  sourceFileName: string;
  importedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const importedPatentamientoIdentifierSchema = new Schema<IImportedPatentamientoIdentifier>(
  {
    identificadorUnico: { type: String, required: true, trim: true, unique: true, index: true },
    sourceFileName: { type: String, required: true, trim: true, index: true },
    importedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

const ImportedPatentamientoIdentifier = mongoose.model<IImportedPatentamientoIdentifier>(
  "imported_patentamiento_identifiers",
  importedPatentamientoIdentifierSchema,
);

export default ImportedPatentamientoIdentifier;
