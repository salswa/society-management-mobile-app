// Vercel serverless entry — wraps the Express app as a single catch-all function.
// (Local dev still uses src/server.ts with app.listen.)
import { createApp } from '../src/app';

export default createApp();
