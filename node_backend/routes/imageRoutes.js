import express from "express";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import rateLimit from "express-rate-limit";

import upload from "../middleware/uploadMiddleware.js";
import { requireAuth } from "../middleware/auth.js";
import ImageJob from "../models/ImageJob.js";
import { ML_SERVICE_URL, RATE_LIMIT_PER_MINUTE, getPlan } from "../config.js";
import { getUsage } from "../services/account.js";

const router = express.Router();

const enhanceLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: RATE_LIMIT_PER_MINUTE,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() ?? req.ip,
  message: { message: "Too many requests. Please slow down." },
});

// Celery state → stored job status
const STATUS_MAP = {
  PENDING: "queued",
  STARTED: "processing",
  RETRY: "processing",
  SUCCESS: "completed",
  FAILURE: "failed",
};

function parseBoolean(value) {
  return value === true || value === "true" || value === "1" || value === "yes";
}

function readOption(req, modernName, legacyName) {
  return req.query[modernName] ?? req.body?.[modernName] ?? req.body?.[legacyName];
}

function removeFile(path) {
  if (path && fs.existsSync(path)) fs.unlinkSync(path);
}

/** Checks plan limits before the upload is accepted. */
async function checkPlan(req, res, next) {
  try {
    const plan = getPlan(req.user.plan);

    if (req.authMethod === "api_key" && !plan.apiAccess) {
      return res.status(403).json({
        code: "plan_api_access",
        message: "API access requires the Pro or Business plan.",
      });
    }

    const usage = await getUsage(req.user);
    if (usage.remaining <= 0) {
      return res.status(402).json({
        code: "quota_exceeded",
        message: `You have used all ${usage.limit} images in your ${plan.name} plan this month. Upgrade to keep enhancing.`,
        usage,
      });
    }
    req.usage = usage;
    next();
  } catch (err) {
    next(err);
  }
}

router.post(
  "/enhance",
  requireAuth,
  enhanceLimiter,
  checkPlan,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
    const uploadedImage = req.files?.file?.[0] ?? req.files?.image?.[0];
    const uploadedFilePath = uploadedImage?.path ?? null;

    try {
      if (!uploadedImage) {
        return res.status(400).json({ message: "Image file is required." });
      }

      const plan = getPlan(req.user.plan);
      const scale = Number(readOption(req, "scale", "scale") ?? 4);
      if (![1, 2, 3, 4, 5].includes(scale)) {
        return res.status(400).json({ message: "Invalid scale. Use 1, 2, 3, 4, or 5." });
      }
      if (scale > plan.maxScale) {
        return res.status(403).json({
          code: "plan_scale",
          message: `${scale}x upscaling requires the Pro plan. Your plan allows up to ${plan.maxScale}x.`,
        });
      }
      const applyDenoise = parseBoolean(readOption(req, "denoise", "applyDenoise"));
      const applySharpen = parseBoolean(readOption(req, "sharpen", "applySharpen"));

      const formData = new FormData();
      formData.append("file", fs.createReadStream(uploadedFilePath), uploadedImage.originalname);

      const mlResponse = await axios.post(`${ML_SERVICE_URL}/enhance`, formData, {
        headers: formData.getHeaders(),
        params: { scale, denoise: applyDenoise, sharpen: applySharpen },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 1000 * 60 * 10,
      });

      const data = mlResponse.data;

      const job = await ImageJob.create({
        jobId: data.job_id,
        uploadId: data.upload_id ?? null,
        userId: req.user._id,
        source: req.authMethod === "api_key" ? "api" : "web",
        originalName: uploadedImage.originalname,
        fileSize: uploadedImage.size,
        scale,
        applyDenoise,
        applySharpen,
      });

      return res.status(202).json({
        ...data,
        message: "Image enhancement job queued.",
        job: { jobId: data.job_id, ...job.toPublic() },
        resultUrl: data.result_url || `/result/${data.job_id}`,
        usage: { ...req.usage, used: req.usage.used + 1, remaining: req.usage.remaining - 1 },
      });
    } catch (error) {
      return res.status(error.response?.status === 400 ? 400 : 502).json({
        message: "Image enhancement failed.",
        error: error.response?.data?.detail || error.message,
      });
    } finally {
      removeFile(uploadedFilePath);
    }
  }
);

router.get("/status/:jobId", async (req, res) => {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/status/${encodeURIComponent(req.params.jobId)}`, {
      timeout: 1000 * 30,
    });
    const data = mlResponse.data;

    // Keep the stored history in sync with Celery.
    const status = STATUS_MAP[data.status];
    if (status) {
      const job = await ImageJob.findOne({ jobId: req.params.jobId });
      if (job && job.status !== status) {
        job.status = status;
        if (status === "completed" || status === "failed") {
          job.finishedAt = new Date();
          job.processingTime = Math.round((job.finishedAt - job.createdAt) / 100) / 10;
          job.error = status === "failed" ? String(data.error ?? "Unknown error") : null;
        }
        await job.save();
      }
    }

    return res.status(mlResponse.status).json(data);
  } catch (error) {
    return res.status(error.response?.status || 502).json({
      message: "Failed to fetch job status.",
      error: error.response?.data?.detail || error.message,
    });
  }
});

router.get("/result/:jobId", async (req, res) => {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/result/${encodeURIComponent(req.params.jobId)}`, {
      responseType: "stream",
      timeout: 1000 * 60 * 10,
      validateStatus: () => true,
    });

    if (mlResponse.status >= 400 || mlResponse.status === 202) {
      mlResponse.data.resume();
      return res.status(mlResponse.status === 202 ? 409 : mlResponse.status).json({
        message: mlResponse.status === 202 ? "Job is not finished yet." : "Failed to fetch result.",
      });
    }

    res.status(200);
    res.setHeader("content-type", mlResponse.headers["content-type"] || "image/png");
    res.setHeader("cache-control", "private, max-age=3600");
    if (mlResponse.headers["content-disposition"]) {
      res.setHeader("content-disposition", mlResponse.headers["content-disposition"]);
    }
    return mlResponse.data.pipe(res);
  } catch (error) {
    return res.status(502).json({
      message: "Failed to fetch result.",
      error: error.message,
    });
  }
});

export default router;
