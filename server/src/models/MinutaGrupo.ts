import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMinutaGrupo extends Document {
  nombre: string;
  participantes: Types.ObjectId[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const minutaGrupoSchema = new Schema<IMinutaGrupo>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    participantes: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
      ],
      validate: {
        validator: (value: Types.ObjectId[]) => Array.isArray(value) && value.length > 0,
        message: "Debes seleccionar al menos un participante",
      },
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true, collection: "minutas_grupos" },
);

minutaGrupoSchema.index({ createdBy: 1, deletedAt: 1, nombre: 1 });

const MinutaGrupo = mongoose.model<IMinutaGrupo>("minutas_grupos", minutaGrupoSchema);

export default MinutaGrupo;
