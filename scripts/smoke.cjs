const { createServer } = require('http');
const { readFile } = require('fs/promises');
const { existsSync } = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require('playwright');

const DIST = 'C:\\Users\\Dell\\CascadeProjects\\atlas-of-ages';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (p === '/') p = '/index.html';
  const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !existsSync(f)) { res.writeHead(404); res.end('x'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  res.end(await readFile(f));
});

(async () => {
  await new Promise((r) => server.listen(18787, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  const errs = [];
  page.on('pageerror', (e) => { if (!errs.some((x) => x.startsWith('pageerror: ' + e.message))) errs.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]); });
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const out = {};
  try {
    await page.goto('http://localhost:18787/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    out.title = await page.title();
    await page.click('#btn-start');
    await page.waitForTimeout(500);
    out.dialogue = await page.evaluate(() => !document.getElementById('dialogue').classList.contains('hidden'));
    // advance chronicler dialogue (3 lines)
    for (let i = 0; i < 6; i++) { await page.keyboard.press('e'); await page.waitForTimeout(150); }
    out.dialogueClosed = await page.evaluate(() => document.getElementById('dialogue').classList.contains('hidden'));
    const p0 = await page.evaluate(() => ({ ...window.AtlasGame.state().player }));
    await page.keyboard.down('d');
    await page.waitForTimeout(1200);
    await page.keyboard.up('d');
    const p1 = await page.evaluate(() => ({ ...window.AtlasGame.state().player }));
    out.moved = Math.abs(p1.x - p0.x) > 40;
    out.movingAnim = p1.moving === true || p1.phase > 0;
    // journal
    await page.keyboard.press('j');
    await page.waitForTimeout(300);
    out.journal = await page.evaluate(() => !document.getElementById('journal').classList.contains('hidden'));
    await page.screenshot({ path: path.join(os.tmpdir(), 'opencode', 'atlas-journal.png') });
    await page.keyboard.press('j');
    // teleport near keeper (4,6) and talk via E
    await page.evaluate(() => {
      const g = window.AtlasGame;
      g.state().player.x = 4.5 * 24; g.state().player.y = 7.5 * 24;
    });
    await page.waitForTimeout(200);
    await page.keyboard.press('e');
    await page.waitForTimeout(400);
    out.keeperTalk = await page.evaluate(() => !document.getElementById('dialogue').classList.contains('hidden'));
    // close ALL dialogue (keep pressing until hidden; talking may reopen)
    for (let i = 0; i < 10; i++) {
      const open = await page.evaluate(() => !document.getElementById('dialogue').classList.contains('hidden'));
      if (!open) break;
      await page.keyboard.press('e');
      await page.waitForTimeout(200);
    }
    out.questAccepted = await page.evaluate(() => !!(window.AtlasGame.state().quests.fruit || {}).active);
    // trial modal: open via API, solve by clicking cards in correct order
    await page.evaluate(() => window.AtlasGame.openTrial());
    await page.waitForTimeout(300);
    out.trialOpen = await page.evaluate(() => !document.getElementById('trial').classList.contains('hidden'));
    const order = ['Light separates day and night', 'Dry land and seas appear', 'Sun, moon and stars are set', 'Humans are formed'];
    for (const ev of order) {
      await page.evaluate((t) => {
        const cards = [...document.querySelectorAll('#trial-cards .tcard')];
        const c = cards.find((x) => x.textContent === t && !x.classList.contains('used'));
        if (c) c.click();
      }, ev);
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1600);
    out.portalOpen = await page.evaluate(() => !!window.AtlasGame.state().portals.eden);
    out.trialClosed = await page.evaluate(() => document.getElementById('trial').classList.contains('hidden'));
    await page.screenshot({ path: path.join(os.tmpdir(), 'opencode', 'atlas-game.png') });
    // Phase 2: new eras + combat + music
    out.eraCount = await page.evaluate(() => window.ATLAS.eras.length);
    await page.evaluate(() => window.AtlasGame.goto(3));
    await page.waitForTimeout(400);
    const w = await page.evaluate(() => ({
      era: window.ATLAS.eras[window.AtlasGame.state().eraIdx].id,
      foes: window.AtlasGame.foes().length,
      npcs: window.ATLAS.eras[3].npcs.length,
      quests: window.ATLAS.eras[3].quests.length
    }));
    out.wilderness = w;
    await page.screenshot({ path: path.join(os.tmpdir(), 'opencode', 'atlas-wilderness.png') });
    // walk into a foe to take damage
    await page.evaluate(() => {
      const g = window.AtlasGame;
      const f = g.foes()[0];
      g.state().player.x = f.x; g.state().player.y = f.y;
    });
    await page.waitForTimeout(400);
    out.hurt = await page.evaluate(() => window.AtlasGame.state().player.hearts);
    // step back and swing until it dies (3 HP, 0.45s cooldown)
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => {
        const g = window.AtlasGame;
        const f = g.foes()[0];
        if (!f) return;
        g.state().player.x = f.x - 20; g.state().player.y = f.y;
        g.state().player.iframes = 2;
      });
      await page.keyboard.press('e');
      await page.waitForTimeout(650);
    }
    const c = await page.evaluate(() => ({
      kills: window.AtlasGame.state().kills,
      light: window.AtlasGame.state().light,
      audio: !!window.AtlasGame.SFX.ctx
    }));
    out.combat = c;
    await page.screenshot({ path: path.join(os.tmpdir(), 'opencode', 'atlas-combat.png') });
    // Phase 3: guidance + foundations + threads
    await page.evaluate(() => window.AtlasGame.goto(0));
    await page.evaluate(() => {
      const g = window.AtlasGame;
      g.state().player.x = 4.5 * 24; g.state().player.y = 7.5 * 24;
    });
    await page.waitForTimeout(300);
    out.guide = await page.evaluate(() => window.AtlasGame.targetInfo());
    // portal travel with briefing scroll (egypt unseen in this save)
    await page.evaluate(() => { window.AtlasGame.state().portals.eden = true; });
    await page.evaluate(() => {
      const g = window.AtlasGame;
      // find eden portal pad
      const e = window.ATLAS.eras[0];
      const pads = [];
      e.map.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === 'o') pads.push({ x, y }); });
      g.state().player.x = (pads[0].x + 0.5) * 24; g.state().player.y = (pads[0].y + 0.5) * 24;
    });
    await page.waitForTimeout(800);
    out.scrollShown = await page.evaluate(() => !document.getElementById('scroll').classList.contains('hidden'));
    out.scrollDate = await page.evaluate(() => document.getElementById('scroll-body').textContent.slice(0, 60));
    await page.click('#scroll-go');
    await page.waitForTimeout(600);
    out.traveled = await page.evaluate(() => window.AtlasGame.state().eraIdx);
    out.scrollClosed = await page.evaluate(() => document.getElementById('scroll').classList.contains('hidden'));
    // threads tab
    await page.keyboard.press('j');
    await page.waitForTimeout(200);
    await page.evaluate(() => { [...document.querySelectorAll('.panel-tabs button')].find((b) => b.dataset.tab === 'threads').click(); });
    await page.waitForTimeout(200);
    out.threads = await page.evaluate(() => ({
      rows: document.querySelectorAll('#journal-body .thread-row').length,
      locked: document.querySelectorAll('#journal-body .thread-row.locked').length
    }));
    await page.screenshot({ path: path.join(os.tmpdir(), 'opencode', 'atlas-threads.png') });
    // Phase 4: reformation age — solas, skeptic, final trial
    await page.evaluate(() => window.AtlasGame.goto(7));
    await page.keyboard.press('j'); // ensure journal shut after threads check
    await page.waitForTimeout(200);
    out.reform = await page.evaluate(() => ({
      era: window.ATLAS.eras[window.AtlasGame.state().eraIdx].id,
      foes: window.AtlasGame.foes().length,
      solasPlaced: window.ATLAS.eras[7].relics.filter((r) => r.questId === 'solas').length
    }));
    // talk to Luther (quest) and the Pardoner (skeptic), closing dialogue each time
    for (const nid of ['luther', 'seller']) {
      await page.evaluate((id) => {
        const g = window.AtlasGame;
        const n = window.ATLAS.eras[7].npcs.find((x) => x.id === id);
        g.state().player.x = (n.x + 0.5) * 24; g.state().player.y = (n.y + 1.0) * 24;
      }, nid);
      await page.waitForTimeout(200);
      await page.keyboard.press('e');
      await page.waitForTimeout(300);
      for (let i = 0; i < 8; i++) {
        const open = await page.evaluate(() => !document.getElementById('dialogue').classList.contains('hidden'));
        if (!open) break;
        await page.keyboard.press('e');
        await page.waitForTimeout(200);
      }
    }
    out.reformQuests = await page.evaluate(() => {
      const q = window.AtlasGame.state().quests;
      return { solas: !!(q.solas || {}).active, price: !!(q.price || {}).active };
    });
    await page.screenshot({ path: path.join(os.tmpdir(), 'opencode', 'atlas-reform.png') });
    const errs2 = await page.evaluate(() => window.AtlasGame.state().quests);
    out.quests = Object.keys(errs2);
  } catch (e) {
    errs.push('crash: ' + e.message);
  }
  console.log(JSON.stringify({ out, errs }, null, 2));
  await browser.close();
  server.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
