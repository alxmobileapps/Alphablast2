import express from 'express';
import { tinyValue } from './_lib/tiny.ts';

// Second half of this round's isolation: express AND a local .ts-extension
// import, TOGETHER, in one function -- something never tested in
// isolation before jumping straight to the full server-api.ts fix. If
// this works but the real /api/health still doesn't, the problem is
// specific to something else inside server-api.ts (its size, its route
// count, or something about express.json()/CORS middleware combined with
// the themeDictionaries.ts file specifically) rather than the general
// "express + local import" combination.
const app = express();
app.get('/api/ping-both', (req, res) => {
  res.json({ pingBoth: 'ok', tinyValue });
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
