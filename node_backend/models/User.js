import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    plan: { type: String, enum: ["free", "pro", "business"], default: "free" },
    billingCycle: { type: String, enum: ["monthly", "yearly", null], default: null },
    planRenewsAt: { type: Date, default: null },
    planCancelAt: { type: Date, default: null },

    // Only a SHA-256 hash of the API key is stored; the key is shown once.
    apiKeyHash: { type: String, default: null, index: true },
    apiKeyPrefix: { type: String, default: null },
    apiKeyCreatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    plan: this.plan,
    billingCycle: this.billingCycle,
    planRenewsAt: this.planRenewsAt,
    planCancelAt: this.planCancelAt,
    apiKey: this.apiKeyPrefix
      ? { prefix: this.apiKeyPrefix, createdAt: this.apiKeyCreatedAt }
      : null,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", userSchema);
