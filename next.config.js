const nextConfig = {
  output: 'standalone',
  experimental: {
    // Remove if not using Server Components
    serverComponentsExternalPackages: ['mongodb'],
  },
  webpack(config, { dev }) {
    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 2000, // check every 2 seconds
        aggregateTimeout: 300, // wait before rebuilding
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none';" },
          // CORS headers removed from here (2026-09-06): this headers() config is
          // static and site-wide, so it can't reflect the real request Origin —
          // it was the source of the Access-Control-Allow-Origin: '*' +
          // Access-Control-Allow-Credentials: true contradiction (Known Issue 0f).
          // The API layer (app/api/[[...path]]/route.js's applyCorsOriginPolicy)
          // now owns CORS dynamically, per request, against an allowlist.
        ],
      },
    ];
  },
};

module.exports = nextConfig;
