/**
 * A shared class code, good enough to keep a paid endpoint from being used by
 * anyone who stumbles onto the URL. It is not user accounts: everyone who has
 * the code is the same visitor as far as the app is concerned.
 */

export const GATE_COOKIE = "senti_access";

/** Twelve hours, so a class does not get logged out mid-lesson. */
export const GATE_MAX_AGE = 60 * 60 * 12;

export type GateState =
  /** No code configured, which is the convenient default for local work. */
  | "open"
  /** Correct code already presented. */
  | "unlocked"
  /** A code is required and has not been given. */
  | "locked"
  /** Deployed without a code. Refuses to serve rather than run up a bill. */
  | "misconfigured";

/** Hex SHA-256, so the cookie never has to carry the code itself. */
export async function tokenFor(passcode: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(passcode),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

export async function gateState(
  cookieValue: string | undefined,
): Promise<GateState> {
  const passcode = process.env.SENTI_PASSCODE;

  if (!passcode) {
    // Failing closed in production means a forgotten environment variable
    // shows an obvious error instead of quietly leaving the model endpoint
    // open to whoever finds the link.
    return process.env.NODE_ENV === "production" ? "misconfigured" : "open";
  }

  if (!cookieValue) return "locked";
  return tokensMatch(cookieValue, await tokenFor(passcode))
    ? "unlocked"
    : "locked";
}
