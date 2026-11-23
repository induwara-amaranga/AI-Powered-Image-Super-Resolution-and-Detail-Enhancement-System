import express from "express";

import Invoice from "../models/Invoice.js";
import { requireAuth } from "../middleware/auth.js";
import { PLANS, getPlan } from "../config.js";
import { addCycle, createInvoice, getUsage } from "../services/account.js";

/**
 * MOCK billing. Nothing here talks to a payment provider. The client sends
 * only the card brand and last 4 digits (never the full number or CVC), and
 * the "charge" always succeeds unless the Stripe-style decline test card
 * ending in 0002 is used.
 */
const router = express.Router();

const DECLINE_TEST_LAST4 = "0002";
const BRANDS = new Set(["visa", "mastercard", "amex", "discover", "card"]);

router.get("/plans", (req, res) => {
  res.json({ plans: Object.values(PLANS), mock: true });
});

router.get("/subscription", requireAuth, async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({
      user: req.user.toPublic(),
      plan: getPlan(req.user.plan),
      usage: await getUsage(req.user),
      invoices: invoices.map((i) => i.toPublic()),
      mock: true,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const { planId, billingCycle, card } = req.body ?? {};

    if (!PLANS[planId] || planId === "free") {
      return res.status(400).json({ message: "Choose a paid plan to check out." });
    }
    if (!["monthly", "yearly"].includes(billingCycle)) {
      return res.status(400).json({ message: "Billing cycle must be monthly or yearly." });
    }
    const last4 = String(card?.last4 ?? "");
    const brand = String(card?.brand ?? "card").toLowerCase();
    if (!/^\d{4}$/.test(last4) || !BRANDS.has(brand)) {
      return res.status(400).json({ message: "Card details are incomplete." });
    }
    if (req.user.plan === planId && req.user.billingCycle === billingCycle && !req.user.planCancelAt) {
      return res.status(409).json({ message: `You are already on the ${getPlan(planId).name} plan.` });
    }

    if (last4 === DECLINE_TEST_LAST4) {
      return res.status(402).json({
        code: "card_declined",
        message: "Your card was declined (demo decline test card).",
      });
    }

    const now = new Date();
    req.user.plan = planId;
    req.user.billingCycle = billingCycle;
    req.user.planRenewsAt = addCycle(now, billingCycle);
    req.user.planCancelAt = null;
    await req.user.save();

    const invoice = await createInvoice(req.user, { plan: planId, billingCycle, card: { brand, last4 } });

    res.status(201).json({
      user: req.user.toPublic(),
      plan: getPlan(planId),
      usage: await getUsage(req.user),
      invoice: invoice.toPublic(),
      mock: true,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/cancel", requireAuth, async (req, res, next) => {
  try {
    if (req.user.plan === "free") {
      return res.status(400).json({ message: "You are on the Free plan." });
    }
    req.user.planCancelAt = req.user.planRenewsAt;
    await req.user.save();
    res.json({ user: req.user.toPublic(), plan: getPlan(req.user.plan), usage: await getUsage(req.user) });
  } catch (err) {
    next(err);
  }
});

router.post("/resume", requireAuth, async (req, res, next) => {
  try {
    if (!req.user.planCancelAt) {
      return res.status(400).json({ message: "Your subscription is not scheduled to cancel." });
    }
    req.user.planCancelAt = null;
    await req.user.save();
    res.json({ user: req.user.toPublic(), plan: getPlan(req.user.plan), usage: await getUsage(req.user) });
  } catch (err) {
    next(err);
  }
});

export default router;
