import mongoose, { Document, Schema } from "mongoose";

export interface IImportedTransferenciaIdentifier extends Document {
  identificadorUnico: string;
  sourceFileName: string;
  importedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const importedTransferenciaIdentifierSchema = new Schema<IImportedTransferenciaIdentifier>(
  {
    identificadorUnico: { type: String, required: true, trim: true, unique: true, index: true },
    sourceFileName: { type: String, required: true, trim: true, index: true },
    importedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

const ImportedTransferenciaIdentifier = mongoose.model<IImportedTransferenciaIdentifier>(
  "imported_transferencia_identifiers",
  importedTransferenciaIdentifierSchema,
);

export default ImportedTransferenciaIdentifier;
