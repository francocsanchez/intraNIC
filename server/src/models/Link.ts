import mongoose, { Document, Schema } from "mongoose";

export interface ILink extends Document {
  url: string;
  descripcion: string;
  createdAt: Date;
  updatedAt: Date;
}

const linkSchema = new Schema<ILink>(
  {
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    descripcion: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: "links" },
);

export default mongoose.model<ILink>("links", linkSchema);
