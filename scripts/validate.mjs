// Atlas of Ages — content validation (run: node scripts/validate.mjs)
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(dir, '..', 'js', 'content.js'), 'utf8');
// crude but effective: evaluate the data file in isolation (it only sets window.ATLAS)
const window = {};
eval(src);
// apply the same border-pad normalization the game performs
(function () {
  const A = window.ATLAS;
  A.eras.forEach((e) => {
    const w = Math.max(...e.map.map((r) => r.length));
    const b = e.map[0][0];
    e.map = e.map.map((r) => r.padEnd(w, b));
  });
})();
const ATLAS = window.ATLAS;
const errs = [];
const OK = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,;:'\"!?—-()";
const KNOWN = new Set(['.', ',', '~', 'T', 'R', 'H', 'N', 'W', 'A', 'F', 'B', 'P', 'o', '*', '#']);

for (const e of ATLAS.eras) {
  const w = e.map[0].length;
  e.map.forEach((row, i) => {
    if (row.length !== w) errs.push(`${e.id} row ${i} len ${row.length} != ${w}`);
    for (const ch of row) if (!KNOWN.has(ch)) errs.push(`${e.id} row ${i} unknown tile '${ch}'`);
  });
  const inB = (x, y, what) => {
    if (x < 0 || y < 0 || x >= w || y >= e.map.length) errs.push(`${e.id} ${what} out of bounds (${x},${y})`);
    else if ('#~TRHNWAFBP'.includes(e.map[y][x])) errs.push(`${e.id} ${what} on solid '${e.map[y][x]}' (${x},${y})`);
  };
  inB(e.playerStart.x, e.playerStart.y, 'playerStart');
  for (const n of (e.npcs || [])) inB(n.x, n.y, 'npc ' + n.id);
  for (const f of (e.foes || [])) inB(f.x, f.y, 'foe');
  for (const r of (e.relics || [])) inB(r.x, r.y, 'relic ' + r.id);
  if (!e.map.some((row) => row.includes('o'))) errs.push(`${e.id} has no portal pad`);
  for (const q of (e.quests || [])) {
    for (const s of q.steps) {
      if (s.talk && !(e.npcs || []).some((n) => n.id === s.talk)) errs.push(`${e.id} quest ${q.id} talks to missing npc ${s.talk}`);
    }
    if (q.giver && !(e.npcs || []).some((n) => n.id === q.giver)) errs.push(`${e.id} quest ${q.id} missing giver ${q.giver}`);
    for (const s of q.steps) {
      if (s.need) {
        const have = (e.relics || []).filter((r) => r.questId === q.id).length;
        if (have < s.need) errs.push(`${e.id} quest ${q.id} needs ${s.need} but only ${have} placed`);
      }
    }
  }
  if (!e.trial || e.trial.events.length !== 4) errs.push(`${e.id} trial must have 4 events`);
}
console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'CONTENT OK');
process.exit(errs.length ? 1 : 0);
