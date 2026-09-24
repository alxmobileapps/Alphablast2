import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './server-api.ts';

// All /api/* route logic (Gemini AI category generation, word validation,
// trivia, word suggestions) now lives in server-api.ts's createApiApp(),
// so it can be shared between this local dev/preview server and Vercel's
// serverless function at api/index.ts -- see server-api.ts's doc
// comment for why that split exists and what bug it fixes.
async function startServer() {
  const app = createApiApp();
  const PORT = 3000;

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
