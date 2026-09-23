import express from 'express';

// Second isolation step. api/ping.ts (zero imports at all) proved Vercel
// Functions work fine on this project. api/index.ts (express +
// themeDictionaries + all 5 routes) still 500s. This file sits exactly in
// between: it imports ONLY express -- nothing from this project, no
// themeDictionaries -- and defines one trivial route.
//
// If alphablast.site/api/ping-express ALSO 500s, express itself is not
// working in this Vercel project's current runtime, and we need to look
// at package.json / Node version / how the function gets bundled.
//
// If it WORKS, express is fine, and the problem is specifically in
// server-api.ts's own code or its themeDictionaries import -- the next
// place to look.
const app = express();
app.get('/api/ping-express', (req, res) => {
  res.json({ pingExpress: 'ok' });
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
