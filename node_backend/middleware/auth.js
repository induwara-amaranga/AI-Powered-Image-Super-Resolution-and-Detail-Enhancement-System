import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET } from "../config.js";
import { applySubscriptionLifecycle } from "../services/account.js";

export function signToken(user, { remember = true } = {}) {
  return jwt.sign({ sub: user._id.toString() }, JWT_SECRET, {
    expiresIn: remember ? "30d" : "1d",
  });
}

export function hashApiKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

async function resolveUser(req) {
  const apiKey = req.get("x-api-key");
  if (apiKey) {
    const user = await User.findOne({ apiKeyHash: hashApiKey(apiKey) });
    if (!user) return { error: "Invalid API key." };
    req.authMethod = "api_key";
    return { user };
  }

  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return { user: null };

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return { error: "Account no longer exists." };
    req.authMethod = "token";
    return { user };
  } catch {
    return { error: "Session expired. Please sign in again." };
  }
}

export async function requireAuth(req, res, next) {
  try {
    const { user, error } = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ message: error || "Sign in required." });
    }
    req.user = await applySubscriptionLifecycle(user);
    next();
  } catch (err) {
    next(err);
  }
}
