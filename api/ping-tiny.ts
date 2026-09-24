import { tinyValue } from './_lib/tiny';

// Fifth isolation test, as minimal as it gets. api/_lib/tiny.ts is a
// single-line file: `export const tinyValue = 42;`. Nothing else.
//
// Every function that imports NOTHING, or only an npm package
// (api/ping.ts, api/ping-express.ts), works. Every function that imports
// ANY local project .ts file, however small, wherever placed
// (api/index.ts, api/ping-theme.ts, api/ping-theme-local.ts, all
// importing themeDictionaries.ts in different locations), 500s.
//
// This is the cleanest possible test of that pattern: if
// alphablast.site/api/ping-tiny ALSO 500s despite importing a file with
// one line and zero complexity, the problem has nothing to do with
// themeDictionaries.ts's size or content at all -- it's that this Vercel
// project/function setup breaks on ANY local relative import, period.
// That points at a project-level setting (Root Directory, Included
// Files, or similar) rather than anything fixable by changing this code.
export default function handler(req: any, res: any) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ pingTiny: 'ok', tinyValue }));
}
