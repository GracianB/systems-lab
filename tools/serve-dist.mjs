/* Cross-platform production-build server for Playwright: no shell-specific env syntax. */
process.env.SITE_ROOT = "dist";
await import("./serve.mjs");
