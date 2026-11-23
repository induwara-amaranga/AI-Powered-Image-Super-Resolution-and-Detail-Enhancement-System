import crypto from "crypto";

export const PORT = Number(process.env.PORT || 5000);
export const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
export const MONGO_URI = process.env.MONGO_URI || "";

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  jwtSecret = crypto.randomBytes(48).toString("hex");
  console.warn(
    "[config] JWT_SECRET is not set. Using a random secret: every sign-in is invalidated when the server restarts. Set JWT_SECRET in production."
  );
}
export const JWT_SECRET = jwtSecret;

export const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE || 60);

/**
 * Subscription plans. Billing is a MOCK: no payment provider is called and
 * no card data is stored beyond brand + last 4 digits for the invoice line.
 */
export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Try AI upscaling on a few photos.",
    priceMonthly: 0,
    priceYearly: 0,
    monthlyQuota: 15,
    maxScale: 4,
    apiAccess: false,
    webpExport: false,
    features: ["15 images per month", "Up to 4x upscale", "Denoise & sharpen", "PNG and JPG export"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For creators who enhance photos every week.",
    priceMonthly: 9,
    priceYearly: 90,
    monthlyQuota: 300,
    maxScale: 5,
    apiAccess: true,
    webpExport: true,
    features: ["300 images per month", "Up to 5x upscale", "WebP export", "REST API access", "Full job history"],
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "High volume and API access for teams.",
    priceMonthly: 29,
    priceYearly: 290,
    monthlyQuota: 2000,
    maxScale: 5,
    apiAccess: true,
    webpExport: true,
    features: ["2,000 images per month", "Up to 5x upscale", "WebP export", "REST API access", "Priority support"],
  },
};

export function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}
