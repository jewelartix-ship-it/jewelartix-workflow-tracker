// Single Vercel serverless function wrapping the whole Express API.
// Vercel's classic (non-Services) model supports exporting an Express app
// directly as a function's default export — this is the long-standing,
// stable way to deploy Express here, unlike the newer "Services" feature
// (still in Beta) which had an unresolved SPA-refresh routing bug.
//
// vercel.json rewrites every /api/* request to this one function; Express's
// own router (mounted at /api in routes/index.ts) handles the rest exactly
// as it does locally and in the Docker image.
import { createApp } from '../backend/src/app.js';

const app = createApp();

export default app;
