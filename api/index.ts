import type { IncomingMessage, ServerResponse } from 'http';
import { createApiApp } from '../server-api.js';

// FOUND IT. After 5 rounds of isolation testing (api/ping.ts, then
// api/ping-express.ts, api/ping-theme.ts, api/ping-theme-local.ts,
// api/ping-tiny.ts -- all removed now that this is fixed), the pattern
// was unmistakable: any function with zero local imports, or only an npm
// package import (like 'express'), worked. ANY function that imported a
// local project .ts file with a relative path -- however small, however
// deeply or shallowly nested -- crashed with 500
// FUNCTION_INVOCATION_FAILED. That includes this exact function, since
// it imports '../server-api'.
//
// The actual cause: this project's package.json has "type": "module", and
// Vercel is running these functions on Node.js 24.x, which executes .ts
// files directly via Node's native TypeScript support (no bundler
// involved). Under Node's native ESM loader, a relative import MUST
// include the file's real extension -- 'from "./server-api"' is invalid;
// it has to be 'from "./server-api.ts"'. Verified directly: the exact
// same error (ERR_MODULE_NOT_FOUND) reproduces with a trivial
// two-file Node ESM project whenever the extension is omitted, and goes
// away the moment it's added. tsconfig.json's `allowImportingTsExtensions`
// flag (already present in this project) exists for exactly this style of
// import; nothing here previously used it.
//
// The fix: every local relative import that a Vercel Function actually
// loads now ends in ".ts" -- here, and in server-api.ts's own import of
// themeDictionaries.ts, and server.ts's import of server-api.ts (for
// consistency / local dev). The frontend's imports of themeDictionaries.ts
// (via Vite, in geminiService.ts / CreateCategoryModal.tsx) were never
// broken -- Vite resolves extension-less imports itself -- so those are
// untouched.
const app = createApiApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req as any, res as any);
}
