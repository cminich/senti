/**
 * Limits for uploaded screenshots, shared so the browser refuses exactly what
 * the route would refuse. Client-safe: no server-only imports.
 */

/**
 * Vercel caps a function request body at 4.5 MB, so the ceiling here is a
 * little under that. Phone screenshots are usually a few hundred kilobytes.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Formats every vision model handles. HEIC is deliberately absent: iPhone
 * screenshots are PNG, and a HEIC file means someone picked a photo instead.
 */
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");

/** Null when the file is fine, otherwise something to show the person. */
export function imageProblem(file: { type: string; size: number }): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "That file is not an image senti can read. Use a PNG or JPEG screenshot.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `That image is larger than ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB. Crop it to just the conversation and try again.`;
  }

  if (file.size === 0) {
    return "That file came through empty.";
  }

  return null;
}
