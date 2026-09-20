/**
 * Shared vocabulary for the kindness read. Kept free of server-only imports so
 * the UI can render labels and coaching copy without pulling in the model code.
 */

export type Band = "kind" | "neutral" | "edgy" | "harsh";

export type Confidence = "low" | "medium" | "high";

/** Patterns that tend to sting. */
export const ROUGH_FLAGS = [
  "sarcasm",
  "mockery",
  "insult",
  "contempt",
  "absolutes",
  "exclusion",
  "passive_aggressive",
  "pressure",
  "profanity_at_person",
] as const;

/** Patterns worth noticing and repeating. */
export const WARM_FLAGS = [
  "appreciation",
  "accountability",
  "repair",
  "curiosity",
  "encouragement",
  "softening",
  "affectionate_teasing",
] as const;

export type RoughFlag = (typeof ROUGH_FLAGS)[number];
export type WarmFlag = (typeof WARM_FLAGS)[number];
export type Flag = RoughFlag | WarmFlag;

export type Turn = {
  speaker: string | null;
  text: string;
  /** 0 = cutting, 100 = generous. */
  kindness: number;
  band: Band;
  /** How the line is likely to land on the person hearing it. */
  readAs: string;
  flags: Flag[];
  /** Whether criticism points at a person or at a situation. */
  aimedAtPerson: boolean;
  sarcasm: { present: boolean; confidence: Confidence; note: string } | null;
  /** A warmer phrasing that keeps the same underlying point. */
  rewrite: string | null;
};

export type SpeakerRead = {
  speaker: string;
  kindness: number;
  band: Band;
  turns: number;
  /** The habit that shows up most for this speaker. */
  pattern: string;
};

export type Analysis = {
  kindness: number;
  band: Band;
  summary: string;
  speakers: SpeakerRead[];
  turns: Turn[];
  coaching: string[];
  /** Set when a conversation needs a person, not a score. */
  escalation: { needed: boolean; note: string } | null;
};

export const BANDS: Record<
  Band,
  { label: string; blurb: string; min: number }
> = {
  kind: {
    label: "Kind",
    blurb: "Warm and easy to receive.",
    min: 75,
  },
  neutral: {
    label: "Neutral",
    blurb: "Plain and matter of fact.",
    min: 50,
  },
  edgy: {
    label: "Edgy",
    blurb: "Could sting, depending on the day.",
    min: 25,
  },
  harsh: {
    label: "Harsh",
    blurb: "Likely to land as a put-down.",
    min: 0,
  },
};

export function bandFor(kindness: number): Band {
  if (kindness >= BANDS.kind.min) return "kind";
  if (kindness >= BANDS.neutral.min) return "neutral";
  if (kindness >= BANDS.edgy.min) return "edgy";
  return "harsh";
}

type FlagMeta = {
  label: string;
  /** Plain-language description of the pattern, no jargon. */
  meaning: string;
  /** One concrete thing to try instead. Only for rough flags. */
  tip?: string;
};

export const FLAG_META: Record<Flag, FlagMeta> = {
  sarcasm: {
    label: "Sarcasm",
    meaning: "Says the opposite of what is meant, so praise reads as a jab.",
    tip: "If the point is worth making, make it straight. Sarcasm makes people guess.",
  },
  mockery: {
    label: "Mockery",
    meaning: "Turns the other person into the punchline.",
    tip: "Joke about the situation instead of about them.",
  },
  insult: {
    label: "Name-calling",
    meaning: "Labels the person rather than naming the problem.",
    tip: "Describe what happened, not what they are.",
  },
  contempt: {
    label: "Dismissal",
    meaning: "Waves the other person off as not worth answering.",
    tip: "Even a short real answer lands better than a shrug.",
  },
  absolutes: {
    label: "Always / never",
    meaning: "Turns one incident into a permanent character flaw.",
    tip: "Stick to the one thing that actually happened.",
  },
  exclusion: {
    label: "Shutting out",
    meaning: "Uses belonging as leverage.",
    tip: "Say what you need without threatening the friendship.",
  },
  passive_aggressive: {
    label: "Indirect dig",
    meaning: "Hostility wrapped in something that sounds pleasant.",
    tip: "Say the real thing plainly. It is kinder than making them decode it.",
  },
  pressure: {
    label: "Pressure",
    meaning: "Leans on guilt to get a yes.",
    tip: "Make the ask once and let them actually choose.",
  },
  profanity_at_person: {
    label: "Aimed swearing",
    meaning: "Profanity pointed at a person rather than a situation.",
    tip: "Swear at the flat tire, not at your friend.",
  },
  appreciation: {
    label: "Appreciation",
    meaning: "Names something the other person did well.",
  },
  accountability: {
    label: "Owning it",
    meaning: "Takes responsibility without excuses.",
  },
  repair: {
    label: "Repair",
    meaning: "Reaches back to fix things after friction.",
  },
  curiosity: {
    label: "Curiosity",
    meaning: "Asks a real question instead of assuming.",
  },
  encouragement: {
    label: "Encouragement",
    meaning: "Leaves the other person steadier than before.",
  },
  softening: {
    label: "Softening",
    meaning: "Owns it as a personal view rather than a verdict.",
  },
  affectionate_teasing: {
    label: "Friendly teasing",
    meaning: "Playful in a way that includes rather than stings.",
  },
};

export function isRough(flag: Flag): flag is RoughFlag {
  return (ROUGH_FLAGS as readonly string[]).includes(flag);
}
