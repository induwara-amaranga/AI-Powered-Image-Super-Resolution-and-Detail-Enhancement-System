import ImageJob from "../models/ImageJob.js";
import Invoice from "../models/Invoice.js";
import { getPlan } from "../config.js";

export function startOfCurrentMonth(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Images counted against the monthly quota. Failed jobs do not count. */
export async function getUsage(user) {
  const plan = getPlan(user.plan);
  const periodStart = startOfCurrentMonth();
  const used = await ImageJob.countDocuments({
    userId: user._id,
    createdAt: { $gte: periodStart },
    status: { $ne: "failed" },
  });
  const periodEnd = new Date(periodStart);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  return {
    used,
    limit: plan.monthlyQuota,
    remaining: Math.max(0, plan.monthlyQuota - used),
    periodStart,
    periodEnd,
  };
}

export function addCycle(date, cycle) {
  const next = new Date(date);
  if (cycle === "yearly") next.setUTCFullYear(next.getUTCFullYear() + 1);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

let invoiceCounter = 0;
export function nextInvoiceNumber() {
  invoiceCounter = (invoiceCounter + 1) % 1000;
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `INV-${stamp}-${Date.now().toString(36).toUpperCase()}${invoiceCounter}`;
}

export async function createInvoice(user, { plan, billingCycle, card }) {
  const p = getPlan(plan);
  return Invoice.create({
    userId: user._id,
    number: nextInvoiceNumber(),
    plan,
    billingCycle,
    amount: billingCycle === "yearly" ? p.priceYearly : p.priceMonthly,
    cardBrand: card?.brand ?? null,
    cardLast4: card?.last4 ?? null,
  });
}

/**
 * Mock subscription lifecycle, applied lazily on each authenticated request:
 * a cancelled plan drops to Free at the end of its period, otherwise it
 * "renews" and a new mock invoice is issued.
 */
export async function applySubscriptionLifecycle(user) {
  if (user.plan === "free" || !user.planRenewsAt) return user;
  const now = new Date();
  if (user.planRenewsAt > now) return user;

  if (user.planCancelAt) {
    user.plan = "free";
    user.billingCycle = null;
    user.planRenewsAt = null;
    user.planCancelAt = null;
  } else {
    let renewsAt = user.planRenewsAt;
    while (renewsAt <= now) {
      await createInvoice(user, { plan: user.plan, billingCycle: user.billingCycle });
      renewsAt = addCycle(renewsAt, user.billingCycle);
    }
    user.planRenewsAt = renewsAt;
  }
  await user.save();
  return user;
}
