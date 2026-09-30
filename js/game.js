/* Atlas of Ages — game state, quests, dialogue, trials, UI, save. */
(function () {
  'use strict';

  const SAVE_KEY = 'atlas_of_ages_v1';
  const TS = window.ATLAS_T.TILE;

  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function toast(msg, ms) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add('hidden'), ms || 2400);
  }

  /* ---------- tiny synth ---------- */
  const SFX = {
    ctx: null, muted: false,
    ensure() {
      if (this.ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try { this.ctx = new AC(); } catch (e) { return false; }
      return true;
    },
    tone(f, t, dur, type, vol) {
      if (this.muted || !this.ensure()) return;
      try {
        const c = this.ctx, o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + dur + 0.05);
      } catch (e) {}
    },
    play(name) {
      if (this.muted || !this.ensure()) return;
      const n = this.ctx.currentTime;
      if (name === 'select') this.tone(660, n, 0.12);
      else if (name === 'pickup') { this.tone(880, n, 0.12); this.tone(1320, n + 0.08, 0.15); }
      else if (name === 'quest') { [523, 659, 784].forEach((f, i) => this.tone(f, n + i * 0.09, 0.25)); }
      else if (name === 'done') { [392, 523, 659, 784].forEach((f, i) => this.tone(f, n + i * 0.1, 0.3)); }
      else if (name === 'portal') { this.tone(220, n, 0.5, 'sawtooth', 0.05); this.tone(880, n + 0.2, 0.5); }
      else if (name === 'swing') { this.tone(320, n, 0.12, 'triangle', 0.07); this.tone(140, n + 0.05, 0.12, 'triangle', 0.06); }
      else if (name === 'hurt') { this.tone(200, n, 0.2, 'square', 0.08); this.tone(120, n + 0.1, 0.25, 'square', 0.07); }
      else if (name === 'bad') this.tone(160, n, 0.25, 'square', 0.06);
      else if (name === 'step') this.tone(440, n, 0.08, 'triangle', 0.05);
    }
  };
  window.addEventListener('pointerdown', () => SFX.ensure(), { once: true });
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'm' || e.key === 'M') && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) {
      SFX.muted = !SFX.muted;
      toast(SFX.muted ? '🔇 Sound off (M to enable)' : '🔊 Sound on');
    }
  });

  /* ---------- state ---------- */
  function freshState() {
    return {
      eraIdx: 0, unlocked: 0, portals: {}, kills: {}, seen: {},
      player: { x: 0, y: 0, dir: 'd', phase: 0, moving: false, hearts: 3, iframes: 0, swingT: 0, swingCD: 0 },
      quests: {}, relics: [], codex: [],
      light: 0, level: 1, won: false
    };
  }
  let S = freshState();
  let FOES = [];
  let SHAKE = 0;

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      if (!d || !d.player) return false;
      S = Object.assign(freshState(), d);
      return true;
    } catch (e) { return false; }
  }

  const engine = new window.AtlasEngine($('game'));
  const eras = () => window.ATLAS.eras;
  const era = () => eras()[S.eraIdx];

  function eraById(id) { return eras().find((e) => e.id === id); }

  function findTiles(ch) {
    const out = [], e = era();
    e.map.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === ch) out.push({ x, y });
    });
    return out;
  }

  function placePlayer() {
    const s = era().playerStart;
    S.player.x = (s.x + 0.5) * TS;
    S.player.y = (s.y + 0.5) * TS;
  }

  /* ---------- quests ---------- */
  function questDef(id) {
    for (const e of eras()) {
      const q = (e.quests || []).find((q) => q.id === id);
      if (q) return q;
    }
    return null;
  }
  function qState(id) {
    if (!S.quests[id]) S.quests[id] = { step: 0, done: false, active: false };
    return S.quests[id];
  }
  function activeQuests() {
    return Object.keys(S.quests).filter((id) => {
      const st = S.quests[id];
      return st.active && !st.done;
    });
  }
  function collectCount(questId) {
    const e = era();
    const ids = new Set((e.relics || []).filter((r) => r.questId === questId).map((r) => r.id));
    return S.relics.filter((id) => ids.has(id)).length;
  }
  function killCount(eraId) { return S.kills[eraId] || 0; }
  function stepText(q, i) {
    const s = q.steps[i];
    if (!s) return '';
    if (s.need) {
      const have = Math.min(s.need, collectCount(q.id));
      return `${s.text} (${have}/${s.need})`;
    }
    if (s.slay) {
      const have = Math.min(s.slay, killCount(q.era));
      return `${s.text} (${have}/${s.slay})`;
    }
    return s.text;
  }
  function checkStep(q) {
    const st = qState(q.id);
    if (!st.active || st.done) return;
    const s = q.steps[st.step];
    if (!s) { completeQuest(q); return; }
    const satisfied = (s.need && collectCount(q.id) >= s.need) ||
      (s.slay && killCount(q.era) >= s.slay);
    if (satisfied) {
      st.step++;
      SFX.play('step');
      toast(`✓ ${s.text} — ${q.steps[st.step] ? stepText(q, st.step) : 'done!'}`);
      save();
      checkStep(q);
    }
  }
  function completeQuest(q) {
    const st = qState(q.id);
    st.done = true;
    S.light += (q.reward && q.reward.light) || 8;
    S.level = 1 + Math.floor(S.light / 30);
    if (q.reward && q.reward.codex && !S.codex.some((c) => c.title === q.reward.codex.title)) {
      S.codex.push(q.reward.codex);
    }
    SFX.play('done');
    engine.burst(S.player.x, S.player.y, ['#ffd166', '#fff7d6', '#6ee7b7'], 22, 130);
    toast(`🏆 Quest complete: ${q.name}  (+${(q.reward && q.reward.light) || 8} 🕯️)`);
    save();
    renderHUD();
  }
  function acceptQuest(q) {
    const st = qState(q.id);
    if (st.active || st.done) return;
    st.active = true;
    SFX.play('quest');
    toast(`📜 New quest: ${q.name}`);
    save();
    renderHUD();
  }

  /* ---------- dialogue ---------- */
  const dlg = { open: false, lines: [], idx: 0, typing: false, full: '', npc: null, onDone: null, timer: 0 };
  function openDialogue(npc, lines, onDone) {
    dlg.open = true; dlg.lines = lines.slice(); dlg.idx = 0; dlg.npc = npc; dlg.onDone = onDone || null;
    $('dialogue').classList.remove('hidden');
    $('dlg-emoji').textContent = npc.emoji;
    $('dlg-name').textContent = npc.name;
    typeLine();
  }
  function typeLine() {
    const el = $('dlg-text');
    dlg.full = dlg.lines[dlg.idx];
    el.textContent = '';
    dlg.typing = true;
    let i = 0;
    clearInterval(dlg.timer);
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { el.textContent = dlg.full; dlg.typing = false; return; }
    dlg.timer = setInterval(() => {
      i += 2;
      el.textContent = dlg.full.slice(0, i);
      if (i >= dlg.full.length) { clearInterval(dlg.timer); dlg.typing = false; }
    }, 24);
  }
  function advanceDialogue() {
    if (!dlg.open) return;
    if (dlg.typing) {
      clearInterval(dlg.timer);
      $('dlg-text').textContent = dlg.full;
      dlg.typing = false;
      return;
    }
    dlg.idx++;
    SFX.play('select');
    if (dlg.idx >= dlg.lines.length) {
      dlg.open = false;
      $('dialogue').classList.add('hidden');
      const cb = dlg.onDone;
      dlg.onDone = null;
      if (cb) cb();
    } else typeLine();
  }
  $('dialogue').addEventListener('click', advanceDialogue);

  function talkTo(npc) {
    const lines = npc.lines.slice();
    openDialogue(npc, lines, () => {
      // quest giver?
      const eq = (era().quests || []).find((q) => q.giver === npc.id);
      if (eq) acceptQuest(eq);
      // step target?
      for (const qid of activeQuests()) {
        const q = questDef(qid);
        const st = qState(qid);
        const s = q.steps[st.step];
        if (s && s.talk === npc.id) {
          st.step++;
          SFX.play('step');
          toast(`✓ ${s.text}`);
          save();
          checkStep(q);
          renderHUD();
        }
      }
    });
  }

  /* ---------- relics ---------- */
  function nearbyRelic() {
    for (const r of (era().relics || [])) {
      if (S.relics.includes(r.id)) continue;
      const rx = (r.x + 0.5) * TS, ry = (r.y + 0.5) * TS;
      if (Math.hypot(rx - S.player.x, ry - S.player.y) < 26) return r;
    }
    return null;
  }
  function pickup(r) {
    S.relics.push(r.id);
    engine.burst((r.x + 0.5) * TS, (r.y + 0.5) * TS, ['#ffd166', '#fff7d6'], 14, 110);
    SFX.play('pickup');
    if (r.codex && !S.codex.some((c) => c.title === r.codex.title)) {
      S.codex.push(r.codex);
      toast(`📜 Codex: ${r.codex.title}`);
    } else if (r.questId) {
      const q = questDef(r.questId);
      if (q) {
        if (!qState(q.id).active && !qState(q.id).done) {
          // auto-accept when gathering for a known giver's quest
          const giverKnown = (era().quests || []).some((qq) => qq.id === q.id);
          if (giverKnown) acceptQuest(q);
        }
        const st = qState(q.id);
        const step = q.steps[st.step];
        if (st.active && !st.done && step && step.need) {
          const have = Math.min(step.need, collectCount(q.id));
          toast(`${r.emoji} ${r.name} (${have}/${step.need})`);
          checkStep(q);
          renderHUD();
        } else toast(`${r.emoji} ${r.name}`);
      } else toast(`${r.emoji} ${r.name}`);
    } else toast(`${r.emoji} ${r.name}`);
    save();
    renderHUD();
  }

  /* ---------- combat: shadows, swings, hearts ---------- */
  function spawnFoes() {
    const eid = era().id;
    const alive = (era().foes || []).slice(killCount(eid));
    FOES = alive.map((f) => ({
      x: (f.x + 0.5) * TS, y: (f.y + 0.5) * TS,
      hp: 3, maxHp: 3, dir: Math.random() * 6.28, wt: 0, hitT: 0, aggro: false
    }));
  }
  function nearestFoe(maxD) {
    let best = null, bd = maxD;
    for (const f of FOES) {
      const d = Math.hypot(f.x - S.player.x, f.y - S.player.y);
      if (d < bd) { bd = d; best = f; }
    }
    return best ? { foe: best, d: bd } : null;
  }
  function swing() {
    const p = S.player;
    if (p.swingCD > 0) return;
    p.swingCD = 0.45;
    p.swingT = 0.22;
    SFX.play('swing');
    let hit = false;
    for (let i = FOES.length - 1; i >= 0; i--) {
      const f = FOES[i];
      const d = Math.hypot(f.x - p.x, f.y - p.y);
      if (d > 44) continue;
      hit = true;
      f.hp--;
      f.hitT = 0.25;
      const a = Math.atan2(f.y - p.y, f.x - p.x);
      engine.moveBody(era(), f, Math.cos(a) * 20, Math.sin(a) * 20);
      engine.burst(f.x, f.y, ['#ffd166', '#fff7d6'], 10, 120);
      if (f.hp <= 0) {
        FOES.splice(i, 1);
        const eid = era().id;
        S.kills[eid] = killCount(eid) + 1;
        S.light += 2;
        S.level = 1 + Math.floor(S.light / 30);
        engine.burst(f.x, f.y, ['#c4b5fd', '#ffd166', '#fff7d6'], 22, 150);
        SFX.play('done');
        toast('💥 Shadow dispersed! (+2 🕯️)');
        for (const qid of activeQuests()) {
          const q = questDef(qid);
          if (q && q.era === eid) checkStep(q);
        }
        save();
        renderHUD();
      }
    }
    if (!hit) engine.burst(p.x, p.y, ['#ffffff'], 3, 40);
  }
  function hurtPlayer(f) {
    const p = S.player;
    if (p.iframes > 0 || p.hearts <= 0) return;
    p.hearts--;
    p.iframes = 1.2;
    SHAKE = 0.35;
    const a = Math.atan2(p.y - f.y, p.x - f.x);
    engine.moveBody(era(), p, Math.cos(a) * 30, Math.sin(a) * 30);
    engine.burst(p.x, p.y, ['#e63946', '#fff7d6'], 14, 130);
    SFX.play('hurt');
    renderHUD();
    if (p.hearts <= 0) {
      toast('💔 Grace restores you — no penalty, pilgrim.');
      p.hearts = 3;
      p.iframes = 2;
      placePlayer();
      spawnFoes();
      renderHUD();
      save();
    }
  }
  function updateFoes(dt) {
    const p = S.player;
    let combat = false;
    for (const f of FOES) {
      if (f.hitT > 0) f.hitT -= dt;
      const dx = p.x - f.x, dy = p.y - f.y;
      const d = Math.hypot(dx, dy);
      f.aggro = d < 130;
      if (f.aggro) {
        combat = true;
        if (d > 14) {
          const s = 66 * dt;
          engine.moveBody(era(), f, (dx / d) * s, (dy / d) * s);
          f.dir = Math.atan2(dy, dx);
        }
        if (d < 17) hurtPlayer(f);
      } else {
        f.wt -= dt;
        if (f.wt <= 0) { f.wt = 1.5 + Math.random() * 2; f.dir = Math.random() * 6.28; }
        engine.moveBody(era(), f, Math.cos(f.dir) * 24 * dt, Math.sin(f.dir) * 24 * dt);
      }
    }
    return combat;
  }
  function drawFoes(cam) {
    const ctx = engine.ctx;
    for (const f of FOES) {
      const x = f.x - cam.x, y = f.y - cam.y;
      const wob = Math.sin(engine.t * 5 + f.x) * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(x, y + 10, 9, 3, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = f.hitT > 0 ? '#f8f9fa' : '#1b1b2f';
      ctx.beginPath(); ctx.ellipse(x, y + wob * 0.4, 10, 12, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#e63946';
      const look = Math.atan2(S.player.y - f.y, S.player.x - f.x);
      ctx.beginPath();
      ctx.arc(x + Math.cos(look) * 3 - 3, y - 3 + wob * 0.4, 2, 0, 6.2832);
      ctx.arc(x + Math.cos(look) * 3 + 3, y - 3 + wob * 0.4, 2, 0, 6.2832);
      ctx.fill();
      if (f.hp < f.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x - 12, y - 20, 24, 4);
        ctx.fillStyle = '#e63946';
        ctx.fillRect(x - 12, y - 20, 24 * (f.hp / f.maxHp), 4);
      }
    }
    // swing arc
    const p = S.player;
    if (p.swingT > 0) {
      const ang = p.dir === 'l' ? Math.PI : p.dir === 'r' ? 0 : p.dir === 'u' ? -Math.PI / 2 : Math.PI / 2;
      ctx.strokeStyle = `rgba(255,240,200,${(p.swingT / 0.22).toFixed(2)})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(p.x - cam.x, p.y - cam.y, 26, ang - 0.9, ang + 0.9);
      ctx.stroke();
    }
  }

  /* ---------- NPC proximity ---------- */
  function nearbyNPC() {
    let best = null, bd = 34;
    for (const n of (era().npcs || [])) {
      const nx = (n.x + 0.5) * TS, ny = (n.y + 0.5) * TS;
      const d = Math.hypot(nx - S.player.x, ny - S.player.y);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  function npcMarker(n) {
    // '!' when this NPC advances something or offers a quest (read-only:
    // never create quest entries from the render loop).
    const eq = (era().quests || []).find((q) => q.giver === n.id);
    if (eq) {
      const st = S.quests[eq.id];
      if (!st || (!st.active && !st.done)) return '!';
    }
    for (const qid of activeQuests()) {
      const q = questDef(qid);
      const st = qState(qid);
      const s = q && q.steps[st.step];
      if (s && s.talk === n.id) return '!';
    }
    return null;
  }

  /* Where next? Resolves the live objective to a world position so the
     compass arrow and the E-prompt always agree with interact(). */
  function portalPos() {
    const pads = portalTiles();
    if (!pads.length) return null;
    return { x: (pads[0].x + 0.5) * TS, y: (pads[0].y + 0.5) * TS };
  }
  function objectiveTarget() {
    const o = currentObjective();
    if (o) {
      const st = S.quests[o.q.id] || { step: 0 };
      const s = o.q.steps[st.step];
      if (s) {
        if (s.talk) {
          const n = (era().npcs || []).find((x) => x.id === s.talk);
          if (n) return { x: (n.x + 0.5) * TS, y: (n.y + 0.5) * TS, label: 'Talk to ' + n.name, kind: 'talk' };
        }
        if (s.need) {
          let best = null, bd = 1e9;
          for (const r of (era().relics || [])) {
            if (r.questId !== o.q.id || S.relics.includes(r.id)) continue;
            const rx = (r.x + 0.5) * TS, ry = (r.y + 0.5) * TS;
            const d = Math.hypot(rx - S.player.x, ry - S.player.y);
            if (d < bd) { bd = d; best = { x: rx, y: ry, label: r.name, kind: 'take' }; }
          }
          if (best) return best;
        }
        if (s.slay) {
          const f = nearestFoe(1e9);
          if (f) return { x: f.foe.x, y: f.foe.y, label: 'Strike the shadow', kind: 'foe' };
        }
      }
    }
    const pp = portalPos();
    if (pp) return { x: pp.x, y: pp.y, label: S.portals[era().id] ? 'Travel onward' : 'Unseal the portal', kind: 'portal' };
    return null;
  }
  function promptFor() {
    const p = S.player;
    const ft = nearestFoe(30);
    const n = nearbyNPC();
    const nd = n ? Math.hypot((n.x + 0.5) * TS - p.x, (n.y + 0.5) * TS - p.y) : 1e9;
    if (ft && (!n || ft.d < nd)) return 'E · Strike!';
    if (n && nd <= 34) return 'E · Talk to ' + n.name;
    const r = nearbyRelic();
    if (r) return 'E · Take ' + r.name;
    const pads = portalTiles();
    const onPad = pads.some((t) => Math.hypot((t.x + 0.5) * TS - p.x, (t.y + 0.5) * TS - p.y) < 40);
    if (onPad) return S.portals[era().id] ? 'E · Travel onward' : 'E · Unseal the way';
    return null;
  }

  /* ---------- portals + trial ---------- */
  function portalTiles() { return findTiles('o'); }
  function onPortalPad() {
    const p = S.player, ts = TS;
    return portalTiles().some((t) => {
      const cx = (t.x + 0.5) * ts, cy = (t.y + 0.5) * ts;
      return Math.abs(cx - p.x) < 16 && Math.abs(cy - p.y) < 16;
    });
  }
  function interact() {
    if (dlg.open) { advanceDialogue(); return; }
    if (!$('journal').classList.contains('hidden')) return;
    if (!$('trial').classList.contains('hidden')) return;
    // steel first: a close shadow takes priority over talk
    const ft = nearestFoe(30);
    const n0 = nearbyNPC();
    if (ft && (!n0 || ft.d < Math.hypot((n0.x + 0.5) * TS - S.player.x, (n0.y + 0.5) * TS - S.player.y))) {
      swing();
      return;
    }
    const n = nearbyNPC();
    if (n) { SFX.play('select'); talkTo(n); return; }
    const r = nearbyRelic();
    if (r) { pickup(r); return; }
    // portal pad?
    const pads = portalTiles();
    const p = S.player;
    const nearPad = pads.some((t) => Math.hypot((t.x + 0.5) * TS - p.x, (t.y + 0.5) * TS - p.y) < 40);
    if (nearPad) {
      if (S.portals[era().id]) travel();
      else openTrial();
    }
  }

  const trial = { order: [], mistakes: 0 };
  function openTrial() {
    const t = era().trial;
    if (!t) { travel(); return; }
    $('trial-title').textContent = t.title;
    $('trial-msg').textContent = '';
    $('trial-msg').className = '';
    trial.order = [];
    trial.mistakes = 0;
    const slots = $('trial-slots');
    slots.innerHTML = '';
    t.events.forEach((ev, i) => {
      const d = document.createElement('div');
      d.className = 'slot';
      d.textContent = (i + 1) + '. …';
      slots.appendChild(d);
    });
    const cards = $('trial-cards');
    cards.innerHTML = '';
    const shuffled = t.events.slice().sort(() => Math.random() - 0.5);
    shuffled.forEach((ev) => {
      const b = document.createElement('button');
      b.className = 'tcard';
      b.textContent = ev;
      b.addEventListener('click', () => pickCard(b, ev));
      cards.appendChild(b);
    });
    $('trial').classList.remove('hidden');
    SFX.play('select');
  }
  function pickCard(btn, ev) {
    const t = era().trial;
    const idx = trial.order.length;
    if (t.events[idx] === ev) {
      trial.order.push(ev);
      btn.classList.add('used');
      const slot = $('trial-slots').children[idx];
      slot.textContent = ev;
      slot.classList.add('full');
      SFX.play('step');
      if (trial.order.length === t.events.length) {
        $('trial-msg').textContent = '✨ The ages stand in order — the way opens!';
        $('trial-msg').className = 'good';
        SFX.play('done');
        S.portals[era().id] = true;
        save();
        setTimeout(() => { $('trial').classList.add('hidden'); travel(); }, 1200);
      }
    } else {
      trial.mistakes++;
      const msg = $('trial-msg');
      msg.textContent = trial.mistakes === 1
        ? 'Not quite — think about which came first. Try again, no penalty.'
        : 'Still not in order. Every historian revises — once more!';
      msg.className = 'bad';
      SFX.play('bad');
      setTimeout(() => { msg.className = ''; }, 600);
      // reset placements, keep calm
      trial.order = [];
      document.querySelectorAll('#trial-cards .tcard').forEach((c) => c.classList.remove('used'));
      document.querySelectorAll('#trial-slots .slot').forEach((s, i) => {
        s.classList.remove('full');
        s.textContent = (i + 1) + '. …';
      });
    }
  }

  function travel() {
    const e = era();
    SFX.play('portal');
    engine.burst(S.player.x, S.player.y, ['#c4b5fd', '#fff7d6'], 30, 160);
    if (!e.next) {
      // final trial passed → victory handled by trial flow; nothing to travel to
      return;
    }
    const atPortal = onPortalPad();
    const nxt = eras()[Math.min(eras().length - 1, eras().findIndex((x) => x.id === e.next))];
    const doSwitch = () => {
      S.eraIdx = eras().findIndex((x) => x.id === nxt.id);
      S.unlocked = Math.max(S.unlocked, S.eraIdx);
      S.seen[nxt.id] = 1;
      placePlayer();
      spawnFoes();
      save();
      renderAll();
      const b = $('era-banner');
      b.textContent = era().name + ' — ' + era().sub;
      setTimeout(() => { b.textContent = era().name; }, 2600);
      toast(`🌀 ${era().name}`);
    };
    // Every first entry to an unseen era briefs its foundations —
    // trial victories and portal steps alike.
    if (!S.seen[nxt.id]) {
      showScroll(nxt, doSwitch);
    } else {
      setTimeout(doSwitch, atPortal ? 350 : 0);
    }
  }

  /* Era foundations briefing: date, facts, verse + the connecting thread. */
  let scrollCb = null;
  function showScroll(nextEra, cb) {
    const i = nextEra.intro || {};
    const facts = (i.facts || []).map((f) => `<li>${f}</li>`).join('');
    $('scroll-body').innerHTML =
      `<h2>${nextEra.name}</h2><div id="scroll-date">${i.date || ''} · ${nextEra.sub || ''}</div>` +
      `<div class="thread">${nextEra.thread || ''}</div>` +
      `<ul>${facts}</ul><div class="verse">${i.verse || ''}</div>`;
    $('scroll').classList.remove('hidden');
    SFX.play('quest');
    scrollCb = () => {
      scrollCb = null;
      $('scroll').classList.add('hidden');
      if (cb) cb();
    };
  }
  function closeScroll() {
    if (scrollCb) scrollCb();
    else $('scroll').classList.add('hidden');
  }
  function dismissScrollSilent() {
    scrollCb = null;
    try { $('scroll').classList.add('hidden'); } catch (e) {}
  }
  $('scroll-go').addEventListener('click', closeScroll);

  /* ---------- HUD / journal / timeline ---------- */
  function currentObjective() {
    // Prefer unfinished business in THIS era, then anywhere else.
    const mine = (era().quests || [])
      .map((q) => ({ q, st: S.quests[q.id] }))
      .find(({ st }) => st && st.active && !st.done);
    if (mine) return { q: mine.q, step: stepText(mine.q, mine.st.step) };
    for (const e of eras()) {
      for (const q of (e.quests || [])) {
        const st = S.quests[q.id];
        if (st && st.active && !st.done) return { q, step: stepText(q, st.step) };
      }
    }
    // suggest next unaccepted quest in current era
    const q = (era().quests || []).find((qq) => {
      const st = S.quests[qq.id];
      return !st || (!st.active && !st.done);
    });
    if (q) return { q, step: 'Find ' + ((era().npcs || []).find((n) => n.id === q.giver) || {}).name || '?' };
    return null;
  }
  function renderHUD() {
    const o = currentObjective();
    $('qt-name').textContent = o ? o.q.name : '🌟 Atlas complete — keep exploring!';
    $('qt-step').textContent = o ? o.step : `${S.codex.length} codex entries gathered`;
    $('st-level').textContent = 'Lv ' + S.level;
    $('st-hearts').textContent = '❤️'.repeat(Math.max(0, S.player.hearts)) + '🖤'.repeat(Math.max(0, 3 - S.player.hearts));
    $('st-light').textContent = '🕯️ ' + S.light;
    $('st-relics').textContent = '🏺 ' + S.relics.length;
    $('era-banner').textContent = era().name;
    const tl = $('timeline');
    tl.innerHTML = '';
    eras().forEach((e, i) => {
      const c = document.createElement('button');
      c.className = 'era-chip' + (i === S.eraIdx ? ' now' : i <= S.unlocked ? ' done' : ' lock');
      c.textContent = (i <= S.unlocked ? e.name : '🔒 ???');
      c.disabled = i > S.unlocked;
      c.addEventListener('click', () => {
        if (i <= S.unlocked && i !== S.eraIdx) {
          S.eraIdx = i;
          placePlayer();
          spawnFoes();
          save();
          renderAll();
          toast(`🌀 ${era().name}`);
          SFX.play('portal');
        }
      });
      tl.appendChild(c);
    });
  }
  function renderJournal(tab) {
    tab = tab || 'quests';
    document.querySelectorAll('.panel-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const body = $('journal-body');
    if (tab === 'quests') {      const ids = Object.keys(S.quests);
      if (!ids.length) { body.innerHTML = '<p class="empty">No quests yet — talk to someone with a golden !</p>'; return; }
      body.innerHTML = ids.map((id) => {
        const q = questDef(id), st = S.quests[id];
        const steps = q.steps.map((s, i) => {
          const done = st.done || i < st.step;
          let label = s.text;
          if (s.need) label += ` (${Math.min(s.need, collectCount(id))}/${s.need})`;
          return `<li class="${done ? 'did' : ''}">${label}</li>`;
        }).join('');
        return `<div class="jq ${st.done ? 'done' : ''}"><span class="st">${st.done ? '✅ done' : st.active ? '🟡 active' : '… '}</span><b>${q.name}</b><small>${q.briefing}</small><ol>${steps}</ol></div>`;
      }).join('');
    } else if (tab === 'threads') {
      body.innerHTML = '<p style="color:#a99e83;font-size:13px;margin-bottom:8px">One story, six ages — each age opens the next.</p>' + eras().map((er, i) => {
        const known = i <= S.unlocked;
        return `<div class="thread-row ${known ? '' : 'locked'}"><b>${known ? er.name : '🔒 ???'}</b><p>${known ? (er.thread || '') : 'Walk further to reveal this thread.'}</p></div>`;
      }).join('');
    } else {
      body.innerHTML = S.codex.length
        ? S.codex.map((c) => `<div class="cx"><b>📜 ${c.title}</b><p>${c.text}</p></div>`).join('')
        : '<p class="empty">No codex entries — pick up glowing scrolls and finish quests.</p>';
    }
  }
  document.querySelectorAll('.panel-tabs button').forEach((b) => b.addEventListener('click', () => renderJournal(b.dataset.tab)));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => $(b.dataset.close).classList.add('hidden')));
  function toggleJournal() {
    const j = $('journal');
    if (j.classList.contains('hidden')) { renderJournal('quests'); j.classList.remove('hidden'); SFX.play('select'); }
    else j.classList.add('hidden');
  }

  function renderAll() { renderHUD(); }

  /* ---------- input: touch stick + keys ---------- */
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) $('touch').classList.remove('hidden');
  (function stick() {
    const base = $('stick'), nub = $('nub');
    let id = null, cx = 0, cy = 0;
    function set(e) {
      const r = base.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      const t = e.touches ? e.touches[0] : e;
      let dx = (t.clientX - cx) / 40, dy = (t.clientY - cy) / 40;
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      engine.joy.x = dx; engine.joy.y = dy;
      nub.style.transform = `translate(calc(-50% + ${dx * 30}px), calc(-50% + ${dy * 30}px))`;
    }
    base.addEventListener('touchstart', (e) => { e.preventDefault(); set(e); }, { passive: false });
    base.addEventListener('touchmove', (e) => { e.preventDefault(); set(e); }, { passive: false });
    const end = () => { engine.joy.x = 0; engine.joy.y = 0; nub.style.transform = 'translate(-50%,-50%)'; };
    base.addEventListener('touchend', end);
    base.addEventListener('touchcancel', end);
  })();
  $('btn-act').addEventListener('click', () => { engine.interactEdge = true; });
  engine.onKey = (k) => {
    if (k === 'j') toggleJournal();
    if (k === 'escape') {
      $('journal').classList.add('hidden');
      if (dlg.open) advanceDialogue();
    }
  };

  /* ---------- procedural music: a psaltery per era + war-drum ---------- */
  const Music = {
    // midi roots + scale colors per era
    voice: {
      eden: { root: 60, scale: [0, 2, 4, 7, 9] },
      egypt: { root: 64, scale: [0, 1, 5, 7, 8] },
      galilee: { root: 67, scale: [0, 2, 4, 7, 9] },
      wilderness: { root: 62, scale: [0, 3, 5, 7, 10] },
      exile: { root: 57, scale: [0, 2, 3, 7, 8] },
      church: { root: 72, scale: [0, 2, 4, 7, 9] }
    },
    t: 0, bar: 0, drum: 0,
    freq(m) { return 440 * Math.pow(2, (m - 69) / 12); },
    update(dt, combat) {
      if (!S.started || SFX.muted || !SFX.ensure()) return;
      const v = this.voice[era().id] || this.voice.eden;
      this.t += dt;
      this.bar -= dt;
      if (this.bar <= 0) {
        this.bar = 2.1;
        const n = SFX.ctx.currentTime;
        SFX.tone(this.freq(v.root), n, 2.4, 'sine', 0.035);
        SFX.tone(this.freq(v.root + v.scale[2]), n + 0.05, 2.4, 'sine', 0.03);
        SFX.tone(this.freq(v.root + 12), n + 0.1, 2.2, 'triangle', 0.02);
        if (Math.random() < 0.45) {
          const step = v.scale[(Math.random() * v.scale.length) | 0];
          SFX.tone(this.freq(v.root + 12 + step), n + 0.5, 0.9, 'sine', 0.045);
        }
      }
      if (combat) {
        this.drum -= dt;
        if (this.drum <= 0) {
          this.drum = 0.5;
          SFX.tone(55, SFX.ctx.currentTime, 0.18, 'sine', 0.09);
        }
      }
    }
  };

  /* ---------- main loop ---------- */
  let last = 0, cam = { x: 0, y: 0 }, autosave = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    engine.t += dt;
    const e = era();
    const uiBusy = dlg.open || !$('journal').classList.contains('hidden') || !$('trial').classList.contains('hidden') || !$('scroll').classList.contains('hidden');

    // click-to-move
    const click = engine.takeClick();
    if (click && !uiBusy && S.started) {
      engine.moveTarget = { x: click.x + cam.x, y: click.y + cam.y };
    }
    if (engine.takeInteract()) {
      if (!S.started || !$('title').classList.contains('hidden')) {
        // title screen consumes its own buttons; ignore world input
      } else if (!$('scroll').classList.contains('hidden')) {
        closeScroll();
      } else if (uiBusy) {
        if (dlg.open) advanceDialogue();
      } else {
        engine.moveTarget = null;
        interact();
      }
    }

    const p = S.player;
    if (S.started && !uiBusy) {
      if (p.iframes > 0) p.iframes -= dt;
      if (p.swingCD > 0) p.swingCD -= dt;
      if (p.swingT > 0) p.swingT -= dt;
      const ax = engine.axis();
      let dx = ax.x * 150 * dt, dy = ax.y * 150 * dt;
      if ((ax.x || ax.y) && engine.moveTarget) engine.moveTarget = null;
      if (!ax.x && !ax.y && engine.moveTarget) {
        const vx = engine.moveTarget.x - p.x, vy = engine.moveTarget.y - p.y;
        const d = Math.hypot(vx, vy);
        if (d < 6) engine.moveTarget = null;
        else { dx = (vx / d) * 150 * dt; dy = (vy / d) * 150 * dt; }
      }
      if (dx || dy) {
        engine.moveBody(e, p, dx, 0);
        engine.moveBody(e, p, 0, dy);
        p.moving = true;
        p.phase += dt * 11;
        if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'r' : 'l';
        else p.dir = dy > 0 ? 'd' : 'u';
      } else p.moving = false;
      // portal pad travel
      if (S.portals[e.id] && onPortalPad() && !travel._cd) {
        travel._cd = true;
        setTimeout(() => { travel._cd = false; }, 2000);
        travel();
      }
      // shadows hunt; war-drums answer
      const combat = updateFoes(dt);
      Music.update(dt, combat);
    } else p.moving = false;

    // camera
    const mw = e.map[0].length * TS, mh = e.map.length * TS;
    cam.x = clamp(p.x - 480, 0, Math.max(0, mw - 960));
    cam.y = clamp(p.y - 300, 0, Math.max(0, mh - 600));
    if (SHAKE > 0) {
      SHAKE -= dt;
      cam.x += (Math.random() - 0.5) * 22 * SHAKE;
      cam.y += (Math.random() - 0.5) * 22 * SHAKE;
    }

    // draw
    const ctx = engine.ctx;
    engine.sky(960, 600, e.sky);
    engine.drawGround(e, cam);
    // relics
    for (const r of (e.relics || [])) {
      if (S.relics.includes(r.id)) continue;
      const rx = (r.x + 0.5) * TS - cam.x, ry = (r.y + 0.5) * TS - cam.y + Math.sin(engine.t * 3 + r.x) * 3;
      ctx.fillStyle = 'rgba(255,215,130,0.25)';
      ctx.beginPath(); ctx.arc(rx, ry, 11, 0, 6.2832); ctx.fill();
      ctx.font = '17px serif'; ctx.textAlign = 'center';
      try { ctx.fillText(r.emoji, rx, ry + 6); } catch (err) {}
    }
    // npcs (y-sorted with player)
    const actors = (e.npcs || []).map((n) => ({ y: (n.y + 0.5) * TS, n }));
    actors.push({ y: p.y, me: true });
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) {
      if (a.me) {
        // mercy blink while invulnerable
        if (!(p.iframes > 0 && Math.floor(engine.t * 12) % 2 === 0)) {
          engine.drawPerson(p.x - cam.x, p.y - cam.y, { color: '#4a4e9e', hood: '#2b2d6e', dir: p.dir, phase: p.phase, moving: p.moving, item: '🎒' });
        }
      } else {
        const n = a.n;
        const nx = (n.x + 0.5) * TS - cam.x, ny = (n.y + 0.5) * TS - cam.y;
        const hop = n.animal ? Math.abs(Math.sin(engine.t * 4 + n.x)) * 3 : 0;
        engine.drawPerson(nx, ny - hop, {
          color: n.color, hood: n.animal ? null : '#5a3d5a', hair: '#4a3728',
          dir: 'd', phase: engine.t * 3 + n.x, moving: !!n.animal,
          item: n.animal ? null : '📖'
        });
        engine.drawBadge(nx, ny - hop, n.emoji, npcMarker(n));
      }
    }
    engine.drawProps(e, cam);
    drawFoes(cam);
    // guidance layer: E-prompt above the pilgrim + golden compass arrow
    if (S.started && !uiBusy) {
      const ctx = engine.ctx;
      const px = p.x - cam.x, py = p.y - cam.y;
      const pr = promptFor();
      if (pr) {
        ctx.font = 'bold 12px Georgia, serif';
        const wpx = ctx.measureText(pr).width + 16;
        ctx.fillStyle = 'rgba(8,6,26,0.85)';
        ctx.strokeStyle = 'rgba(255,215,130,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(px - wpx / 2, py - 44, wpx, 20, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffe9b0';
        ctx.textAlign = 'center';
        ctx.fillText(pr, px, py - 30);
      }
      const tgt = objectiveTarget();
      if (tgt) {
        const dx = tgt.x - p.x, dy = tgt.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d > 70) {
          const a = Math.atan2(dy, dx);
          const ax = px + Math.cos(a) * 30, ay = py + Math.sin(a) * 30;
          const pulse = 0.65 + 0.35 * Math.sin(engine.t * 4);
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(a);
          ctx.globalAlpha = pulse;
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-3, 0); ctx.lineTo(-6, 7);
          ctx.closePath(); ctx.fill();
          ctx.restore();
          ctx.globalAlpha = 1;
        }
      }
    }
    engine.stepParticles(dt);
    engine.drawParticles(cam);
    // vignette
    const vg = ctx.createRadialGradient(480, 300, 260, 480, 300, 640);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 960, 600);

    autosave += dt;
    if (autosave > 10) { autosave = 0; if (S.started) save(); }
  }

  /* ---------- boot ---------- */
  $('btn-start').addEventListener('click', () => {
    S = freshState();
    S.started = true;
    placePlayer();
    spawnFoes();
    S.seen[era().id] = 1;
    save();
    $('title').classList.add('hidden');
    $('hud').classList.remove('hidden');
    $('timeline').classList.remove('hidden');
    renderAll();
    SFX.play('quest');
    openDialogue(
      { name: 'The Chronicler', emoji: '🧭' },
      ['So. A new traveler walks the ages.', 'Move with WASD or arrows — or tap where you wish to go. Press E beside glowing things.', 'One law of these lands, pilgrim: every gift here is GIVEN, never earned. Your walking is the response, not the price. Find the Keeper. The Garden needs you.'],
      null
    );
  });
  if (load()) $('btn-continue').classList.remove('hidden');
  $('btn-continue').addEventListener('click', () => {
    S.started = true;
    if (!S.player.hearts) S.player.hearts = 3;
    S.seen = S.seen || {};
    S.seen[era().id] = 1;
    spawnFoes();
    $('title').classList.add('hidden');
    $('hud').classList.remove('hidden');
    $('timeline').classList.remove('hidden');
    renderAll();
    toast(`⤺ Welcome back — ${era().name}`);
  });
  $('btn-roam').addEventListener('click', () => $('victory').classList.add('hidden'));

  // final trial → victory wiring happens in pickCard via travel(); patch: if no next era, celebrate
  const _travel = travel;
  travel = function () {
    const e = era();
    if (!e.next) {
      if (S.won) return;
      S.won = true;
      SFX.play('done');
      engine.burst(S.player.x, S.player.y, ['#ffd166', '#fff7d6', '#f9c74f'], 60, 220);
      S.light += 25;
      S.level = 1 + Math.floor(S.light / 30);
      save();
      renderHUD();
      $('victory-stats').textContent = `Level ${S.level} · ${S.light} 🕯️ · ${S.relics.length} relics · ${S.codex.length} codex entries`;
      setTimeout(() => $('victory').classList.remove('hidden'), 900);
      return;
    }
    _travel();
  };

  // expose for tests
  window.AtlasGame = {
    state: () => S, engine, interact, openTrial, SFX,
    foes: () => FOES,
    targetInfo() {
      const t = objectiveTarget();
      const pr = !S.started ? null : promptFor();
      return { target: t, prompt: pr };
    },
    goto(i) { dismissScrollSilent(); S.eraIdx = i; S.unlocked = Math.max(S.unlocked, i); S.seen[era().id] = 1; placePlayer(); spawnFoes(); renderAll(); }
  };
  requestAnimationFrame(frame);
})();
