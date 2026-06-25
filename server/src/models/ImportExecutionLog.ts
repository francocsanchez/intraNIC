import mongoose, { Document, Schema } from "mongoose";

export type ImportExecutionStatus = "running" | "success" | "partial" | "failed" | "skipped";

export interface IImportExecutionErrorDetail {
  line?: number | null;
  identificadorUnico?: string;
  message: string;
}

export interface IImportExecutionLog extends Document {
  jobName: string;
  sourceType: "sftp";
  trigger: "cron" | "manual";
  sourcePath: string;
  fileName: string | null;
  status: ImportExecutionStatus;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  totalRead: number;
  inserted: number;
  updated: number;
  discarded: number;
  errored: number;
  message: string;
  errorSummary: string[];
  errorDetailsSample: IImportExecutionErrorDetail[];
  createdAt: Date;
  updatedAt: Date;
}

const importExecutionErrorDetailSchema = new Schema<IImportExecutionErrorDetail>(
  {
    line: { type: Number, default: null },
    identificadorUnico: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const importExecutionLogSchema = new Schema<IImportExecutionLog>(
  {
    jobName: { type: String, required: true, trim: true, index: true },
    sourceType: { type: String, required: true, enum: ["sftp"] },
    trigger: { type: String, required: true, enum: ["cron", "manual"] },
    sourcePath: { type: String, required: true, trim: true },
    fileName: { type: String, default: null, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["running", "success", "partial", "failed", "skipped"],
      index: true,
    },
    startedAt: { type: Date, required: true, default: Date.now, index: true },
    finishedAt: { type: Date, default: null },
    durationMs: { type: Number, default: null },
    totalRead: { type: Number, default: 0 },
    inserted: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    discarded: { type: Number, default: 0 },
    errored: { type: Number, default: 0 },
    message: { type: String, default: "", trim: true },
    errorSummary: { type: [String], default: [] },
    errorDetailsSample: {
      type: [importExecutionErrorDetailSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const ImportExecutionLog = mongoose.model<IImportExecutionLog>(
  "import_execution_logs",
  importExecutionLogSchema,
);

export default ImportExecutionLog;
