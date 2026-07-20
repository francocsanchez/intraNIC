import mongoose, { Document, Schema, Types } from "mongoose";

export interface IFsanchezOperacionEstado extends Document {
  opera: string;
  cancelada: boolean;
  alerta: "normal" | "media" | "alta";
  comentario: string;
  updatedBy?: Types.ObjectId | null;
  updatedByName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const fsanchezOperacionEstadoSchema = new Schema<IFsanchezOperacionEstado>(
  {
    opera: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    cancelada: {
      type: Boolean,
      default: true,
    },
    alerta: {
      type: String,
      enum: ["normal", "media", "alta"],
      default: "normal",
      trim: true,
    },
    comentario: {
      type: String,
      default: "",
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    updatedByName: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true, collection: "fsanchez_operaciones_estado" },
);

fsanchezOperacionEstadoSchema.index({ opera: 1 }, { unique: true });

const FsanchezOperacionEstado = mongoose.model<IFsanchezOperacionEstado>(
  "fsanchez_operaciones_estado",
  fsanchezOperacionEstadoSchema,
);

export default FsanchezOperacionEstado;
