/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server in .next/standalone for Docker/self-hosting.
  // Vercel ignores this and uses its own Build Output API, so it's safe here.
  output: "standalone",
  // The mongodb driver is a native/server dependency; keep it out of the bundle.
  serverExternalPackages: ["mongodb"],
  // Pin the tracing root to this project (a stray lockfile exists in the home dir).
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
