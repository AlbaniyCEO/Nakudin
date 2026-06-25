// Entry point for the Vercel serverless function.
// Imports vercel-app (no pino-http, no worker threads) so esbuild can
// produce a single outfile without the esbuildPluginPino multi-entry conflict.
import app from "./vercel-app";
export default app;
