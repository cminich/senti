import Sentiment from "sentiment";

const analyzer = new Sentiment();

export type Polarity = "positive" | "neutral" | "negative";

/** Normalized scores inside this band of zero read as neutral. */
export const NEUTRAL_BAND = 10;

export type Keyword = {
  word: string;
  /** Combined AFINN weight for every occurrence in the turn. */
  score: number;
  count: number;
};

export type Turn = {
  id: number;
  speaker: string | null;
  text: string;
  /** Raw AFINN sum, where each matched word contributes -5 to +5. */
  raw: number;
  /** Raw sum divided by token count. */
  comparative: number;
  /** Raw sum projected onto -100 to +100. */
  score: number;
  polarity: Polarity;
  words: number;
  keywords: Keyword[];
};

export type SpeakerSummary = {
  speaker: string;
  turns: number;
  words: number;
  raw: number;
  score: number;
  polarity: Polarity;
  split: Record<Polarity, number>;
};

export type Analysis = {
  turns: Turn[];
  speakers: SpeakerSummary[];
  /** Conversation sentiment on a -100 to +100 scale. */
  score: number;
  polarity: Polarity;
  words: number;
  raw: number;
  split: Record<Polarity, number>;
  drivers: { positive: Keyword[]; negative: Keyword[] };
};

export function toPolarity(score: number): Polarity {
  if (score > NEUTRAL_BAND) return "positive";
  if (score < -NEUTRAL_BAND) return "negative";
  return "neutral";
}

/**
 * AFINN sums grow with length, so a long polite paragraph containing one harsh
 * word would otherwise read the same as a blunt one-line insult. Damping by the
 * square root of the token count keeps both on a comparable footing, and tanh
 * squashes the result into the -100 to +100 range without a hard clip.
 */
function normalize(raw: number, tokens: number): number {
  if (tokens === 0 || raw === 0) return 0;
  return Math.round(100 * Math.tanh(raw / Math.sqrt(tokens) / 2.5));
}

/**
 * Rolls per-turn scores into one figure. Turns are weighted by the square root
 * of their length so a substantial paragraph outweighs a one-word reply without
 * drowning it out entirely.
 */
function blend(items: { score: number; words: number }[]): number {
  let weighted = 0;
  let total = 0;
  for (const item of items) {
    const weight = Math.sqrt(Math.max(item.words, 1));
    weighted += item.score * weight;
    total += weight;
  }
  return total === 0 ? 0 : Math.round(weighted / total);
}

/** Leading bullets, quote markers and `[10:32]` style timestamps. */
const LINE_PREFIX = /^\s*(?:[-–—*•>]+\s*)?(?:\[[^\]]{0,32}\]\s*)?/;

/**
 * A speaker label is everything before the first colon. Requiring whitespace
 * after the colon keeps URLs and `10:30` timestamps from being read as names.
 */
const SPEAKER_LINE = /^([^\s:][^:]{0,39}?)\s*:\s+(\S.*)$/;

function parseLine(line: string): { speaker: string | null; text: string } {
  const body = line.replace(LINE_PREFIX, "");
  const match = SPEAKER_LINE.exec(body);
  if (!match) return { speaker: null, text: body };

  const label = match[1].trim();
  const looksLikeName = /\p{L}/u.test(label) && label.split(/\s+/).length <= 5;
  return looksLikeName
    ? { speaker: label, text: match[2].trim() }
    : { speaker: null, text: body };
}

function collectKeywords(calculation: Record<string, number>[]): Keyword[] {
  const found = new Map<string, Keyword>();
  // `sentiment` walks tokens back to front, so flip into reading order.
  for (const entry of [...calculation].reverse()) {
    for (const [word, score] of Object.entries(entry)) {
      const existing = found.get(word);
      if (existing) {
        existing.score += score;
        existing.count += 1;
      } else {
        found.set(word, { word, score, count: 1 });
      }
    }
  }
  return [...found.values()].sort(
    (a, b) => Math.abs(b.score) - Math.abs(a.score),
  );
}

function emptySplit(): Record<Polarity, number> {
  return { positive: 0, neutral: 0, negative: 0 };
}

function summarizeSpeakers(turns: Turn[]): SpeakerSummary[] {
  const groups = new Map<string, Turn[]>();
  for (const turn of turns) {
    if (!turn.speaker) continue;
    const key = turn.speaker.toLowerCase();
    const group = groups.get(key);
    if (group) group.push(turn);
    else groups.set(key, [turn]);
  }

  return [...groups.values()]
    .map((group) => {
      const split = emptySplit();
      for (const turn of group) split[turn.polarity] += 1;
      const score = blend(group);

      return {
        speaker: group[0].speaker as string,
        turns: group.length,
        words: group.reduce((sum, turn) => sum + turn.words, 0),
        raw: group.reduce((sum, turn) => sum + turn.raw, 0),
        score,
        polarity: toPolarity(score),
        split,
      };
    })
    .sort((a, b) => b.turns - a.turns || b.words - a.words);
}

function rankDrivers(turns: Turn[]): Analysis["drivers"] {
  const totals = new Map<string, Keyword>();
  for (const turn of turns) {
    for (const keyword of turn.keywords) {
      const existing = totals.get(keyword.word);
      if (existing) {
        existing.score += keyword.score;
        existing.count += keyword.count;
      } else {
        totals.set(keyword.word, { ...keyword });
      }
    }
  }

  const ranked = [...totals.values()];
  return {
    positive: ranked
      .filter((keyword) => keyword.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    negative: ranked
      .filter((keyword) => keyword.score < 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5),
  };
}

export function analyzeDialogue(input: string): Analysis {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = lines.map(parseLine).filter((line) => line.text.length > 0);
  // When only some lines carry a label, treat the rest as continuations.
  const labelled = parsed.some((line) => line.speaker !== null);

  let previous: string | null = null;
  const turns: Turn[] = parsed.map((line, index) => {
    if (line.speaker) previous = line.speaker;
    const result = analyzer.analyze(line.text);
    const words = result.tokens.length;
    const score = normalize(result.score, words);

    return {
      id: index,
      speaker: line.speaker ?? (labelled ? previous : null),
      text: line.text,
      raw: result.score,
      comparative: result.comparative,
      score,
      polarity: toPolarity(score),
      words,
      keywords: collectKeywords(result.calculation),
    };
  });

  const split = emptySplit();
  for (const turn of turns) split[turn.polarity] += 1;
  const score = blend(turns);

  return {
    turns,
    speakers: summarizeSpeakers(turns),
    score,
    polarity: toPolarity(score),
    words: turns.reduce((sum, turn) => sum + turn.words, 0),
    raw: turns.reduce((sum, turn) => sum + turn.raw, 0),
    split,
    drivers: rankDrivers(turns),
  };
}
