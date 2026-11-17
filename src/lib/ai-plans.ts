/**
 * AI features of SiteYantra, their running cost, and the firm's plan.
 *
 * Each firm's app keeps one plan: which AI features are on and the firm's billing details
 * (site-media/_library/BILLING/plan.json). AI server functions refuse a feature that is off.
 * Prices per use and the credit balance are in ai-credits.ts / ai-credits.server.ts.
 */
export const BILLING_DIR = "_library/BILLING";
export const PLAN_FILE = `${BILLING_DIR}/plan.json`;

export type AiFeatureKey =
  | "drawing-reader"
  | "price-reader"
  | "boq-ai"
  | "optimiser"
  | "photo-check"
  | "planning-ai"
  | "assistant"
  | "render";

export type AiFeature = {
  key: AiFeatureKey;
  name: string;
  does: string;
  where: { to: string; label: string }[];
  /** Typical tokens per use, for the running-cost estimate. */
  inTok: number;
  outTok: number;
  per: string; // what one "use" is
  usesPerMonth: number; // typical for one active project
};

export const AI_FEATURES: AiFeature[] = [
  {
    key: "drawing-reader",
    name: "Drawing reader (BOQ from drawings)",
    does: "Reads architectural and structural drawings and fills the take-off: rooms, openings, footings, columns, beams, slabs, steel. The BOQ is then worked out stage by stage.",
    where: [{ to: "/boq-from-drawings", label: "BOQ from Drawings" }],
    inTok: 20000,
    outTok: 4000,
    per: "drawing set read",
    usesPerMonth: 15,
  },
  {
    key: "price-reader",
    name: "Price-list and quote reader",
    does: "Pulls brands' MRP price lists from the internet or reads uploaded dealer lists, proformas and quotations into the price database.",
    where: [
      { to: "/price-database", label: "Price Database" },
      { to: "/price-ocr", label: "Price OCR" },
    ],
    inTok: 25000,
    outTok: 20000,
    per: "price list or quote read",
    usesPerMonth: 20,
  },
  {
    key: "boq-ai",
    name: "BOQ estimator and rates",
    does: "Drafts a BOQ from a project brief, suggests brand options, finds product images and proposes labour rates.",
    where: [{ to: "/boq-engine", label: "BOQ Engine" }],
    inTok: 10000,
    outTok: 25000,
    per: "estimate or suggestion run",
    usesPerMonth: 10,
  },
  {
    key: "optimiser",
    name: "Cost optimiser",
    does: "Suggests alternate materials and brands at lower rates, shows the saving on each, and applies only the swaps you approve.",
    where: [{ to: "/budget-fit", label: "Budget Fit" }],
    inTok: 15000,
    outTok: 5000,
    per: "optimiser run",
    usesPerMonth: 8,
  },
  {
    key: "photo-check",
    name: "Photo vs drawing check",
    does: "Compares a site photo (conduits, pipes, sleeves, reinforcement, masonry) with the drawing sheet before a wall is closed or a slab is poured.",
    where: [{ to: "/stage-drawings", label: "Stage Drawings & Photo Check" }],
    inTok: 4000,
    outTok: 1000,
    per: "photo checked",
    usesPerMonth: 120,
  },
  {
    key: "planning-ai",
    name: "Programme and re-plan",
    does: "Builds the construction programme and, when the site slips, suggests a recovery plan with a new forecast.",
    where: [{ to: "/replan", label: "Programme Re-plan" }],
    inTok: 10000,
    outTok: 15000,
    per: "programme or re-plan",
    usesPerMonth: 4,
  },
  {
    key: "assistant",
    name: "SiteYantra AI Assistant",
    does: "Answers questions about the live project: BOQ, stock, pours, QA, purchases, bills and progress, for every role.",
    where: [{ to: "/ai", label: "SiteYantra AI Assistant" }],
    inTok: 6000,
    outTok: 800,
    per: "question answered",
    usesPerMonth: 300,
  },
  {
    key: "render",
    name: "Renders: bathrooms and electrical walls",
    does: "Turns a toilet's plumbing sheet into a photo-real bathroom render with your tiles and fittings, or a room's electrical sheet into the finished wall (or the conduit layout before plaster), when the client or site needs to see it.",
    where: [{ to: "/renders", label: "Renders" }],
    inTok: 3000,
    outTok: 1300,
    per: "render",
    usesPerMonth: 20,
  },
];

/** Google's Gemini 3.7 Flash rates from 1 Jan 2027 (USD per million tokens). */
export const RATE_IN = 1.5;
export const RATE_OUT = 7.5;

export type Billing = {
  firm: string;
  gstin: string;
  pan: string;
  address: string;
  state: string;
  pin: string;
  contact: string;
  email: string;
  phone: string;
  poRef: string;
};
export const emptyBilling = (): Billing => ({
  firm: "",
  gstin: "",
  pan: "",
  address: "",
  state: "",
  pin: "",
  contact: "",
  email: "",
  phone: "",
  poRef: "",
});

export type Plan = {
  features: Partial<Record<AiFeatureKey, boolean>>;
  usage?: Partial<Record<AiFeatureKey, number>>; // the firm's own estimate of uses per month
  billing: Billing;
  savedAt: string;
  savedBy: string;
};

/** A feature is on unless the firm's plan switches it off (an app with no plan has everything on). */
export const isOn = (plan: Plan | null | undefined, key: AiFeatureKey) =>
  plan?.features?.[key] !== false;

export function costPerUse(f: AiFeature, usdInr: number) {
  return ((f.inTok * RATE_IN + f.outTok * RATE_OUT) / 1_000_000) * usdInr;
}

export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
