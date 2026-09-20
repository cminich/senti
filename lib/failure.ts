/**
 * Turns a thrown model error into something worth showing. Two audiences read
 * the same screen: a student who can only retry, and whoever set the project up
 * and can actually fix it. Keeping them in separate fields means neither has to
 * read the other's message.
 */

export const RETRY = "The read did not come back. Try again in a moment.";

export type Failure = {
  /** Safe for a student to read. */
  error: string;
  /** Set only when retrying cannot possibly help. */
  fix?: string;
  status: number;
};

/**
 * Flattens the error chain. The gateway reports the provider's response as a
 * `cause`, and that is usually the only place the real reason appears.
 */
function unwrap(error: unknown): { status?: number; text: string } {
  const messages: string[] = [];
  let status: number | undefined;
  let current: unknown = error;

  for (let depth = 0; current instanceof Error && depth < 4; depth += 1) {
    messages.push(current.message);
    const code = (current as { statusCode?: unknown }).statusCode;
    if (status === undefined && typeof code === "number") status = code;
    current = current.cause;
  }

  return { status, text: messages.join(" ").toLowerCase() };
}

/**
 * `garbled` covers the case where the model replied but not in the shape the
 * schema asks for, which the caller detects and we cannot see from the message.
 */
export function describeFailure(
  error: unknown,
  { garbled = false }: { garbled?: boolean } = {},
): Failure {
  const { status, text } = unwrap(error);

  // An unverified Gateway account arrives as an internal server error, so the
  // class of the error claims "transient" when nothing about it is. The
  // response body is the only reliable tell.
  if (
    text.includes("customer_verification_required") ||
    text.includes("credit card")
  ) {
    return {
      error: RETRY,
      fix: "The AI Gateway account has no card on file, so it is refusing every request. Add one under AI Gateway in the Vercel dashboard, which also releases the free credits. No redeploy needed.",
      status: 503,
    };
  }

  if (status === 401 || status === 403 || text.includes("authentication")) {
    return {
      error: RETRY,
      fix: "The AI Gateway rejected the credentials. Check that AI_GATEWAY_API_KEY holds a key generated in the Vercel dashboard, then redeploy so the new value is picked up.",
      status: 503,
    };
  }

  if (status === 404 || text.includes("model_not_found")) {
    return {
      error: RETRY,
      fix: "No model is available under that name. Set SENTI_MODEL to an ID the gateway lists, or remove it to fall back to the built-in default.",
      status: 503,
    };
  }

  if (status === 429) {
    return {
      error: "Too many reads at once. Wait a few seconds and try again.",
      status: 429,
    };
  }

  if (garbled) {
    return {
      error: "That read came back garbled. Try it once more.",
      status: 502,
    };
  }

  return { error: RETRY, status: 502 };
}
