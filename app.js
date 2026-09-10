// Vercel entrypoint.
// Vercel auto-detects Express apps at the project root (app.js / index.js / server.js)
// and deploys the exported app as a single serverless function — no app.listen() needed.
// Local development still uses src/servers/index.js (port listener + cleanup scheduler).
import "express"; // explicit framework import so Vercel detects this as an Express app
import app from "./src/servers/app.js";

export default app;
