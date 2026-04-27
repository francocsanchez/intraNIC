import mongoose, { Document, Schema } from "mongoose";

export interface IVersion extends Document {
  nombre: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const versionSchema = new Schema<IVersion>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

versionSchema.index({ nombre: 1 }, { unique: true });

const Version = mongoose.model<IVersion>("versiones", versionSchema);

export default Version;
