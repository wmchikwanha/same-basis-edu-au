export type EquityCategory =
  | "exclusion"
  | "lowered-expectations"
  | "deficit-language"
  | "stigmatising-language"
  | "cultural-stereotyping";

export interface EquityFlagDraft {
  category: EquityCategory;
  severity: "low" | "medium" | "high";
  phrase: string;
  reason: string;
  excerpt: string;
  detector: "rules" | "ai-review";
}

export const EQUITY_LABELS: Record<EquityCategory, string> = {
  exclusion: "Exclusion from learning",
  "lowered-expectations": "Lowered expectations",
  "deficit-language": "Deficit language",
  "stigmatising-language": "Stigmatising language",
  "cultural-stereotyping": "Cultural stereotyping",
};
