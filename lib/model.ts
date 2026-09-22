/**
 * Both routes talk to the same model: one reads a conversation, the other
 * reads a screenshot of one. Keeping the choice here means a deployment
 * switches them together and they cannot drift apart.
 */

export const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

export function modelId(): string {
  return process.env.SENTI_MODEL || DEFAULT_MODEL;
}
