// Vercel maps every /api/* request to this serverless function.
// The Express app keeps its existing /api/... route paths.
import app from '../server/index.js';

export default app;
