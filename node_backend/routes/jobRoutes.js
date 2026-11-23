import express from "express";
import axios from "axios";

import ImageJob from "../models/ImageJob.js";
import { requireAuth } from "../middleware/auth.js";
import { ML_SERVICE_URL } from "../config.js";

const router = express.Router();

const STATUS_FILTERS = new Set(["queued", "processing", "completed", "failed"]);

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function deleteJobFiles(job) {
  try {
    await axios.delete(`${ML_SERVICE_URL}/jobs/${encodeURIComponent(job.jobId)}`, {
      params: job.uploadId ? { upload_id: job.uploadId } : {},
      timeout: 15000,
    });
  } catch (err) {
    // The record is removed either way; any files left behind stay on the shared volume.
    console.warn(`[jobs] could not delete files for ${job.jobId}: ${err.message}`);
  }
}

// Original upload, used for history thumbnails and the "before" image.
// Public by job id (an unguessable uuid), like /result/:jobId.
router.get("/:jobId/original", async (req, res) => {
  try {
    const job = await ImageJob.findOne({ jobId: req.params.jobId });
    if (!job?.uploadId) return res.status(404).json({ message: "Original image not found." });

    const ml = await axios.get(`${ML_SERVICE_URL}/input/${encodeURIComponent(job.uploadId)}`, {
      responseType: "stream",
      timeout: 60000,
      validateStatus: () => true,
    });
    if (ml.status >= 400) return res.status(ml.status).json({ message: "Original image not found." });

    res.setHeader("content-type", ml.headers["content-type"] || "application/octet-stream");
    res.setHeader("cache-control", "private, max-age=3600");
    ml.data.pipe(res);
  } catch (err) {
    res.status(502).json({ message: "Could not load the original image.", error: err.message });
  }
});

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 12));
    const filter = { userId: req.user._id };

    if (STATUS_FILTERS.has(req.query.status)) filter.status = req.query.status;

    const days = Number(req.query.days);
    if (days > 0) filter.createdAt = { $gte: new Date(Date.now() - days * 86400000) };

    const q = String(req.query.q ?? "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ originalName: rx }, { jobId: rx }];
    }

    const [jobs, total] = await Promise.all([
      ImageJob.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      ImageJob.countDocuments(filter),
    ]);

    res.json({
      jobs: jobs.map((j) => j.toPublic()),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:jobId", async (req, res, next) => {
  try {
    const job = await ImageJob.findOne({ jobId: req.params.jobId, userId: req.user._id });
    if (!job) return res.status(404).json({ message: "Job not found." });
    res.json({ job: job.toPublic() });
  } catch (err) {
    next(err);
  }
});

router.delete("/:jobId", async (req, res, next) => {
  try {
    const job = await ImageJob.findOne({ jobId: req.params.jobId, userId: req.user._id });
    if (!job) return res.status(404).json({ message: "Job not found." });
    await deleteJobFiles(job);
    await job.deleteOne();
    res.json({ deleted: 1 });
  } catch (err) {
    next(err);
  }
});

// Clear history. Jobs still in the queue are kept so they are not orphaned.
router.delete("/", async (req, res, next) => {
  try {
    const jobs = await ImageJob.find({
      userId: req.user._id,
      status: { $in: ["completed", "failed"] },
    });
    for (const job of jobs) await deleteJobFiles(job);
    const { deletedCount } = await ImageJob.deleteMany({ _id: { $in: jobs.map((j) => j._id) } });
    res.json({ deleted: deletedCount });
  } catch (err) {
    next(err);
  }
});

export default router;
