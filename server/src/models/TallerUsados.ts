import mongoose, { Schema } from "mongoose";

const TallerUsadosSchema = new Schema({
  nombre: { type: String, required: true, trim: true },
  nombreNormalizado: { type: String, required: true, unique: true, trim: true },
  tipoTrabajo: { type: String, default: "", trim: true },
  activo: { type: Boolean, default: true },
  legacySourceId: { type: String, unique: true, sparse: true },
}, { collection: "usados_talleres", timestamps: true });

export default mongoose.model("TallerUsados", TallerUsadosSchema);
