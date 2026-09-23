import { createApiApp } from '../server-api';

// Vercel's catch-all function convention: any request path is routed here
// because this file is named [...path].ts inside the api/ folder. Before
// this file existed, there was NO function anywhere under api/, so Vercel
// had nothing to route /api/* requests to at all -- vercel.json's old
// catch-all rewrite ("/(.*)" -> "/index.html") caught them first and just
// served the app's index.html page instead of a JSON answer. See
// server-api.ts's doc comment and this same fix's change to vercel.json.
//
// An Express app instance is itself a valid Node (req, res) request
// handler, so it can be exported directly here -- no extra adapter needed.
export default createApiApp();
