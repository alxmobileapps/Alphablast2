import type { IncomingMessage, ServerResponse } from 'http';
import { createApiApp } from '../server-api';

// Vercel's catch-all function convention: any request path is routed here
// because this file is named [...path].ts inside the api/ folder. Before
// this file existed, there was NO function anywhere under api/, so Vercel
// had nothing to route /api/* requests to at all -- vercel.json's old
// catch-all rewrite ("/(.*)" -> "/index.html") caught them first and just
// served the app's index.html page instead of a JSON answer. See
// server-api.ts's doc comment and this same fix's change to vercel.json.
//
// The app is built once per warm function instance (module-level, not
// per-request) so every route's middleware only gets registered once.
const app = createApiApp();

// Exported as an explicit (req, res) function rather than `export default
// app` directly. Both are documented-valid ways to run Express on Vercel,
// but wrapping it removes any ambiguity about whether this project's
// current Node runtime treats a bare Express app object as a request
// handler -- it's always just a plain function call either way.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req as any, res as any);
}
