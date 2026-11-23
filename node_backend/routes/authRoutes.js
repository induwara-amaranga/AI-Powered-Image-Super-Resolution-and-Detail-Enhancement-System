import crypto from "crypto";
import express from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

import User from "../models/User.js";
import { requireAuth, signToken, hashApiKey } from "../middleware/auth.js";
import { getPlan } from "../config.js";
import { getUsage } from "../services/account.js";

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts. Please wait a few minutes and try again." },
});

function validatePassword(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    return `Password must be at least ${MIN_PASSWORD} characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return null;
}

async function sessionPayload(user, token) {
  return {
    ...(token ? { token } : {}),
    user: user.toPublic(),
    plan: getPlan(user.plan),
    usage: await getUsage(user),
  };
}

router.post("/signup", credentialLimiter, async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = req.body?.password;

    if (!name) return res.status(400).json({ message: "Please enter your name." });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "Please enter a valid email address." });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    if (await User.exists({ email })) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });

    return res.status(201).json(await sessionPayload(user, signToken(user)));
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    next(err);
  }
});

router.post("/signin", credentialLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const remember = req.body?.remember !== false;

    const user = await User.findOne({ email });
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) return res.status(401).json({ message: "Incorrect email or password." });

    return res.json(await sessionPayload(user, signToken(user, { remember })));
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    res.json(await sessionPayload(req.user));
  } catch (err) {
    next(err);
  }
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    if (!name) return res.status(400).json({ message: "Name cannot be empty." });
    req.user.name = name.slice(0, 80);
    await req.user.save();
    res.json(await sessionPayload(req.user));
  } catch (err) {
    next(err);
  }
});

router.post("/password", requireAuth, credentialLimiter, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    if (!(await bcrypt.compare(String(currentPassword ?? ""), req.user.passwordHash))) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ message: passwordError });

    req.user.passwordHash = await bcrypt.hash(newPassword, 12);
    await req.user.save();
    res.json({ message: "Password updated." });
  } catch (err) {
    next(err);
  }
});

router.post("/api-key", requireAuth, async (req, res, next) => {
  try {
    if (!getPlan(req.user.plan).apiAccess) {
      return res.status(403).json({
        code: "plan_api_access",
        message: "API access is available on the Pro and Business plans.",
      });
    }
    const apiKey = `isr_${crypto.randomBytes(24).toString("base64url")}`;
    req.user.apiKeyHash = hashApiKey(apiKey);
    req.user.apiKeyPrefix = apiKey.slice(0, 10);
    req.user.apiKeyCreatedAt = new Date();
    await req.user.save();
    // The full key is returned exactly once.
    res.status(201).json({ apiKey, user: req.user.toPublic() });
  } catch (err) {
    next(err);
  }
});

router.delete("/api-key", requireAuth, async (req, res, next) => {
  try {
    req.user.apiKeyHash = null;
    req.user.apiKeyPrefix = null;
    req.user.apiKeyCreatedAt = null;
    await req.user.save();
    res.json({ user: req.user.toPublic() });
  } catch (err) {
    next(err);
  }
});

export default router;
