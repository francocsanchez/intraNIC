import mongoose, { Document, Schema } from "mongoose";

export interface ISsiVentasHotAlertConfig extends Document {
  emails: string[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ssiVentasHotAlertConfigSchema = new Schema<ISsiVentasHotAlertConfig>(
  {
    emails: {
      type: [String],
      default: [],
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "ssi_ventas_hot_alert_config" },
);

const SsiVentasHotAlertConfig = mongoose.model<ISsiVentasHotAlertConfig>(
  "ssi_ventas_hot_alert_config",
  ssiVentasHotAlertConfigSchema,
);

export default SsiVentasHotAlertConfig;
