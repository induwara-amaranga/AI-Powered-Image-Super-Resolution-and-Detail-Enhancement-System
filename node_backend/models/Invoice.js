import mongoose from "mongoose";

// Mock invoice. Created by the demo checkout; no real charge happens.
const invoiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    number: { type: String, required: true },
    plan: { type: String, required: true },
    billingCycle: { type: String, enum: ["monthly", "yearly"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    cardBrand: { type: String, default: null },
    cardLast4: { type: String, default: null },
    status: { type: String, enum: ["paid"], default: "paid" },
  },
  { timestamps: true }
);

invoiceSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    number: this.number,
    plan: this.plan,
    billingCycle: this.billingCycle,
    amount: this.amount,
    currency: this.currency,
    card: this.cardLast4 ? { brand: this.cardBrand, last4: this.cardLast4 } : null,
    status: this.status,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("Invoice", invoiceSchema);
