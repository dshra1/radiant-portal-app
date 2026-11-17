/**
 * Prepaid AI credits. AI runs on SAHA's key; each firm buys credits from SAHA in the app
 * and every AI use deducts a fixed, round price. 1 credit = ₹1 (before GST; GST is charged on
 * the top-up). Prices live in code so only SAHA can change them, through a deploy.
 */
import type { AiFeatureKey } from "@/lib/ai-plans";

/** Price per use, in credits (₹). Round prices with margin over Google's cost. */
export const PRICE_PER_USE: Record<AiFeatureKey, number> = {
  assistant: 2,
  "photo-check": 5,
  "drawing-reader": 15,
  optimiser: 15,
  "planning-ai": 30,
  "price-reader": 40,
  "boq-ai": 50,
};

export type TopUpPack = { id: string; pay: number; credits: number; label: string };
/** Packs: price before GST, credits received (bigger packs carry bonus credits). */
export const TOP_UP_PACKS: TopUpPack[] = [
  { id: "p1000", pay: 1000, credits: 1000, label: "Starter" },
  { id: "p5000", pay: 5000, credits: 5250, label: "Site (5% bonus)" },
  { id: "p20000", pay: 20000, credits: 22000, label: "Firm (10% bonus)" },
];
export const GST_PCT = 18;
export const LOW_BALANCE = 200;

export type CreditEvent = {
  id: string;
  type: "use" | "topup" | "adjust";
  credits: number; // + for top-up/adjust in, − for use
  key?: AiFeatureKey;
  by: string; // user id or email
  at: string;
  ref?: string; // payment id, note
};
export type Wallet = {
  balance: number;
  topupTotal: number;
  spentTotal: number;
  months: Record<string, Partial<Record<AiFeatureKey, { uses: number; credits: number }>>>;
  recent: CreditEvent[];
  updatedAt: string;
};
export const emptyWallet = (): Wallet => ({
  balance: 0,
  topupTotal: 0,
  spentTotal: 0,
  months: {},
  recent: [],
  updatedAt: "",
});
export type CreditsSummary = {
  billing: boolean; // credits switched on for this app
  payments: boolean; // online top-up available
  wallet: Wallet;
};
