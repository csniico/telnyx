import "server-only";

/**
 * Central place to read server-only environment variables.
 * Importing "server-only" makes the build fail if any of this leaks into a
 * client component bundle.
 *
 * Uses lazy getters so `next build` never throws on a missing var — the check
 * only fires when the value is actually read at request time.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See .env.example.`,
    );
  }
  return value;
}

export const env = {
  get telnyxApiKey() {
    return required("TELNYX_API_KEY");
  },
  get telnyxPublicKey() {
    return process.env.TELNYX_PUBLIC_KEY ?? "";
  },
  get mongoUri() {
    return required("MONGODB_URI");
  },
  get mongoDb() {
    return process.env.MONGODB_DB ?? "telnyx_admin";
  },
  get webhookToleranceSeconds() {
    return Number(process.env.WEBHOOK_TOLERANCE_SECONDS ?? "300");
  },
  get adminUsername() {
    return required("ADMIN_USERNAME");
  },
  get adminPassword() {
    return required("ADMIN_PASSWORD");
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};
