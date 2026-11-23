import mongoose from "mongoose";

const imageJobSchema = new mongoose.Schema(
  {
    // Celery task id; this is the public job id used in every URL.
    jobId: { type: String, required: true, unique: true },
    // FastAPI's upload uuid, used to name files on the shared volume.
    uploadId: { type: String, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    source: { type: String, enum: ["web", "api"], default: "web" },

    originalName: { type: String, required: true },
    fileSize: { type: Number, default: null },
    scale: { type: Number, required: true },
    applyDenoise: { type: Boolean, default: false },
    applySharpen: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },
    error: { type: String, default: null },
    finishedAt: { type: Date, default: null },
    processingTime: { type: Number, default: null }, // seconds, submit → finish
  },
  { timestamps: true }
);

imageJobSchema.index({ userId: 1, createdAt: -1 });

imageJobSchema.methods.toPublic = function toPublic() {
  return {
    jobId: this.jobId,
    originalName: this.originalName,
    fileSize: this.fileSize,
    scale: this.scale,
    denoise: this.applyDenoise,
    sharpen: this.applySharpen,
    status: this.status,
    error: this.error,
    source: this.source,
    createdAt: this.createdAt,
    finishedAt: this.finishedAt,
    processingTime: this.processingTime,
    resultUrl: `/result/${this.jobId}`,
    originalUrl: this.uploadId ? `/api/jobs/${this.jobId}/original` : null,
  };
};

export default mongoose.model("ImageJob", imageJobSchema);
