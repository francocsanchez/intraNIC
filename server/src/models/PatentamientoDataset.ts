import mongoose, { Document, Schema } from "mongoose";

export type PatentamientoDatasetType =
  | "pais-marcas"
  | "zona-nic-marcas"
  | "pais-modelos"
  | "zona-nic-modelos";

export interface IPatentamientoMonthColumn {
  key: string;
  monthNumber: number;
  header: string;
}

export interface IPatentamientoRow {
  primaryValue: string;
  total: number;
  months: Map<string, number>;
}

export interface IPatentamientoDataset extends Document {
  datasetType: PatentamientoDatasetType;
  label: string;
  scope: "pais" | "zona-nic";
  entity: "marca" | "modelo";
  primaryColumn: "marca" | "modelo";
  sourceFileName: string;
  monthColumns: IPatentamientoMonthColumn[];
  rows: IPatentamientoRow[];
  rowCount: number;
  importedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const patentamientoMonthColumnSchema = new Schema<IPatentamientoMonthColumn>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    monthNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    header: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const patentamientoRowSchema = new Schema<IPatentamientoRow>(
  {
    primaryValue: {
      type: String,
      required: true,
      trim: true,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    months: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { _id: false },
);

const patentamientoDatasetSchema = new Schema<IPatentamientoDataset>(
  {
    datasetType: {
      type: String,
      required: true,
      enum: ["pais-marcas", "zona-nic-marcas", "pais-modelos", "zona-nic-modelos"],
      unique: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      required: true,
      enum: ["pais", "zona-nic"],
    },
    entity: {
      type: String,
      required: true,
      enum: ["marca", "modelo"],
    },
    primaryColumn: {
      type: String,
      required: true,
      enum: ["marca", "modelo"],
    },
    sourceFileName: {
      type: String,
      required: true,
      trim: true,
    },
    monthColumns: {
      type: [patentamientoMonthColumnSchema],
      default: [],
    },
    rows: {
      type: [patentamientoRowSchema],
      default: [],
    },
    rowCount: {
      type: Number,
      required: true,
      default: 0,
    },
    importedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const PatentamientoDataset = mongoose.model<IPatentamientoDataset>(
  "patentamientos_dataset",
  patentamientoDatasetSchema,
);

export default PatentamientoDataset;
