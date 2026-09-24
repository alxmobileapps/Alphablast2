import { matchSmartTheme } from './_lib/themeDictionaries';

// Fourth isolation test. We confirmed locally (compiled with plain tsc
// and run in plain Node, outside Vercel entirely) that themeDictionaries.ts
// loads perfectly fine and matchSmartTheme() works correctly -- nothing
// wrong with the file's content or logic. So the crash on
// alphablast.site/api/ping-theme is specific to something about how
// VERCEL bundles/resolves that particular import, not the code itself.
//
// The one thing every working function (api/ping.ts, api/ping-express.ts)
// has in common, that every failing one (api/index.ts, api/ping-theme.ts)
// doesn't, is: the failing ones import a local project file that lives
// OUTSIDE the api/ folder (../server-api, ../src/data/themeDictionaries).
//
// This is an exact copy of themeDictionaries.ts placed INSIDE api/ (at
// api/_lib/themeDictionaries.ts) and imported with a same-directory-tree
// relative path, instead of reaching out to ../src/data/. If
// alphablast.site/api/ping-theme-local works while ping-theme still
// doesn't, that confirms this Vercel project isn't bundling files from
// outside api/ correctly, and the real fix is moving the shared code
// api/-side (or fixing a Root Directory / project setting) rather than
// anything about the file's own content.
export default function handler(req: any, res: any) {
  const matched = matchSmartTheme('space');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ pingThemeLocal: 'ok', matchedName: matched?.name || null }));
}
