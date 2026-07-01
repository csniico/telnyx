/** @type {import('next').NextConfig} */
const nextConfig = {
  // The mongodb driver is a native/server dependency; keep it out of the bundle.
  serverExternalPackages: ["mongodb"],
  // Pin the tracing root to this project (a stray lockfile exists in the home dir).
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
