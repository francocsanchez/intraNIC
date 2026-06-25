import mongoose, { Document, Schema } from "mongoose";

export interface IImportedSourceFile extends Document {
  jobName: string;
  fileName: string;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const importedSourceFileSchema = new Schema<IImportedSourceFile>(
  {
    jobName: { type: String, required: true, trim: true, index: true },
    fileName: { type: String, required: true, trim: true },
    processedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

importedSourceFileSchema.index({ jobName: 1, fileName: 1 }, { unique: true });

const ImportedSourceFile = mongoose.model<IImportedSourceFile>(
  "imported_source_files",
  importedSourceFileSchema,
);

export default ImportedSourceFile;
