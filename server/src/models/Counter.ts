import mongoose, { Document, Schema } from "mongoose";

export interface ICounter extends Document {
  key: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Counter = mongoose.model<ICounter>("counters", counterSchema);

export default Counter;
