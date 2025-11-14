import { randomBytes } from "node:crypto";

export function generateInviteToken(length = 32) {
  // Length is number of bytes; convert to base64url for shorter tokens
  const bytes = randomBytes(length);
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
