// ONE reader, two sources. The wrapper hashes what the build wrote to disk;
// the harness hashes what the server actually returned. Both go through this
// file on purpose: when two code paths read the same thing, giving them one
// shared reader is what stops you buying the same bug twice and fixing it
// twice, with the second copy the one nobody remembers.
//
// WHAT THE DIGEST COVERS, and why it is a tree walk rather than a scan of
// index.html's references.
//
// The first version of this gate compared the JS bundle NAME. The proof gate
// defeated it by editing index.html and public/robots.txt -- both outside the
// JS module graph, so the chunk name did not move and a stale dist reported
// ALL PASS. The obvious repair was to hash index.html plus everything it
// references. That is still an ENUMERATION, and an enumeration cannot be
// complete: an image referenced only from CSS, a font pulled in by a
// stylesheet, a file in public/ nobody links from the document, all sit
// outside it. Closing instances one at a time is what you do instead of
// naming the class.
//
// So the class is enumerated from a single source: EVERY file the build wrote
// into dist/. The wrapper walks that tree and emits a manifest; the harness
// fetches exactly those paths and hashes what came back. A file the build
// produced and the server does not serve is a REFUSAL, not a skip.
//
// The remaining limit, stated rather than papered over: a file the SERVER
// serves that the BUILD did not produce is not detected, because nothing on
// the wire enumerates it. That direction cannot make a stale artifact look
// fresh, which is the failure this gate exists to stop.
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, posix } from 'node:path';

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

async function walk(root, rel = '') {
  const out = [];
  for (const e of await readdir(join(root, rel), { withFileTypes: true })) {
    const r = posix.join(rel, e.name);
    if (e.isDirectory()) out.push(...await walk(root, r));
    else if (e.isFile()) out.push('/' + r);
  }
  return out;
}

function digestOver(entries) {
  return sha(Buffer.from(entries.join('\n'), 'utf8'));
}

export async function digestOfDir(dir) {
  let paths;
  try { paths = (await walk(dir)).sort(); } catch (e) { return { ok: false, why: `cannot walk ${dir}: ${e.message}` }; }
  if (paths.length === 0) return { ok: false, why: `${dir} is empty` };
  const entries = [];
  for (const p of paths) entries.push(p + ':' + sha(await readFile(dir + p)));
  return { ok: true, digest: digestOver(entries), count: entries.length, manifest: paths };
}

export async function digestOfServer(base, manifest) {
  if (!Array.isArray(manifest) || manifest.length === 0) {
    return { ok: false, why: 'no manifest supplied, so there is nothing to compare against' };
  }
  const entries = [];
  const missing = [];
  for (const p of [...manifest].sort()) {
    let buf = null;
    try {
      const r = await fetch(base + p);
      if (r.ok) buf = Buffer.from(await r.arrayBuffer());
    } catch { /* falls through to missing */ }
    if (!buf) { missing.push(p); continue; }
    entries.push(p + ':' + sha(buf));
  }
  if (missing.length) {
    return { ok: false, why: `the server did not return ${missing.length} file(s) the build produced: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', ...' : ''}` };
  }
  return { ok: true, digest: digestOver(entries), count: entries.length };
}

// CLI: node digest.mjs --dir <path> [manifest-out]
if (process.argv[1] && process.argv[1].endsWith('digest.mjs')) {
  const [, , mode, arg, manOut] = process.argv;
  if (mode !== '--dir') { console.error('usage: digest.mjs --dir <path> [manifest-out]'); process.exit(2); }
  const r = await digestOfDir(arg);
  if (!r.ok) { console.error('DIGEST CANNOT CHECK: ' + r.why); process.exit(2); }
  if (manOut) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(manOut, JSON.stringify(r.manifest), 'utf8');
  }
  console.log(r.digest + ' ' + r.count);
}
