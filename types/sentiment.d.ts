declare module "sentiment" {
  interface AnalysisOptions {
    language?: string;
    extras?: Record<string, number>;
  }

  interface AnalysisResult {
    /** Sum of the AFINN weights of every matched token. */
    score: number;
    /** `score` divided by the total token count. */
    comparative: number;
    /** One `{ word: weight }` entry per match, in reverse token order. */
    calculation: Record<string, number>[];
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }

  class Sentiment {
    constructor(options?: Record<string, unknown>);
    analyze(phrase: string, options?: AnalysisOptions): AnalysisResult;
    registerLanguage(languageCode: string, language: unknown): void;
  }

  export = Sentiment;
}
