const { createServer } = require('http');
const { readFile } = require('fs/promises');
const { existsSync } = require('fs');
const path = require('path');
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
  await new Promise((r) => server.listen(18783, r));
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu-vsync', '--run-all-compositor-stages-before-draw'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://localhost:18783/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  // instrument frame counter
  await page.evaluate(() => {
    window.__frames = 0;
    window.__t0 = performance.now();
    const count = () => { window.__frames++; requestAnimationFrame(count); };
    requestAnimationFrame(count);
  });
  const fps = async (ms) => {
    await page.waitForTimeout(ms);
    return page.evaluate(() => {
      const dt = (performance.now() - window.__t0) / 1000;
      const f = window.__frames;
      window.__frames = 0; window.__t0 = performance.now();
      return +(f / dt).toFixed(1);
    });
  };
  await page.click('#btn-start');
  await page.waitForTimeout(500);
  // close dialogue
  for (let i = 0; i < 8; i++) {
    const open = await page.evaluate(() => !document.getElementById('dialogue').classList.contains('hidden'));
    if (!open) break;
    await page.keyboard.press('e');
    await page.waitForTimeout(150);
  }
  const calm = await fps(5000);
  // combat stress: spawn burst + hold movement + swing
  await page.evaluate(() => {
    const g = window.AtlasGame;
    g.state().player.x = 30.5 * 24; g.state().player.y = 8.5 * 24;
    for (let i = 0; i < 5; i++) g.engine.burst(400, 300, ['#ffd166', '#fff'], 40, 200);
  });
  await page.keyboard.down('d');
  const combat = await fps(5000);
  await page.keyboard.up('d');
  console.log(JSON.stringify({ calm, combat, errs: errs.slice(0, 3) }));
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
