import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMinutaTemario {
  orden: number;
  nombre: string;
  desarrollo: string;
}

export interface IMinuta extends Document {
  fecha: Date;
  tema: string;
  moderador: Types.ObjectId;
  participantes: Types.ObjectId[];
  temario: IMinutaTemario[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | null;
  sentAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const minutaTemarioSchema = new Schema<IMinutaTemario>(
  {
    orden: {
      type: Number,
      required: true,
      min: 1,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    desarrollo: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const minutaSchema = new Schema<IMinuta>(
  {
    fecha: {
      type: Date,
      required: true,
      index: true,
    },
    tema: {
      type: String,
      required: true,
      trim: true,
    },
    moderador: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
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
    temario: {
      type: [minutaTemarioSchema],
      validate: {
        validator: (value: IMinutaTemario[]) => Array.isArray(value) && value.length > 0,
        message: "Debes agregar al menos un tema al temario",
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
    sentAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true, collection: "minutas" },
);

minutaSchema.index({ deletedAt: 1, fecha: -1, createdAt: -1 });

const Minuta = mongoose.model<IMinuta>("minutas", minutaSchema);

export default Minuta;
