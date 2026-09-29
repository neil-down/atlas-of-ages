/* Atlas of Ages — engine: loop, camera, input, tiles, sprites, particles. */
(function () {
  'use strict';

  const SOLID = new Set(['#', '~', 'T', 'R', 'H', 'N', 'W', 'A', 'F', 'B', 'P']);
  const T = { W: 960, H: 600, TILE: 24 };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  class Engine {
    constructor(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.keys = {};
      this.joy = { x: 0, y: 0 };
      this.interactEdge = false;
      this.moveTarget = null; // click-to-move (world px)
      this.t = 0;
      this.particles = [];
      this.onInteract = null;
      this.bind();
    }

    bind() {
      window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
        if (!e.repeat) {
          this.keys[k] = true;
          if (k === 'e' || k === 'enter' || k === ' ') this.interactEdge = true;
          if (this.onKey) this.onKey(k);
        }
      });
      window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
      this.cv.addEventListener('pointerdown', (e) => {
        const r = this.cv.getBoundingClientRect();
        const sx = T.W / r.width, sy = T.H / r.height;
        this._click = { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
      });
    }

    takeClick() { const c = this._click; this._click = null; return c; }
    takeInteract() { const v = this.interactEdge; this.interactEdge = false; return v; }

    axis() {
      let x = 0, y = 0;
      const k = this.keys;
      if (k['a'] || k['arrowleft']) x -= 1;
      if (k['d'] || k['arrowright']) x += 1;
      if (k['w'] || k['arrowup']) y -= 1;
      if (k['s'] || k['arrowdown']) y += 1;
      x += this.joy.x; y += this.joy.y;
      const m = Math.hypot(x, y);
      if (m > 1) { x /= m; y /= m; }
      return { x, y };
    }

    solidAt(era, tx, ty) {
      if (ty < 0 || ty >= era.map.length || tx < 0 || tx >= era.map[0].length) return true;
      return SOLID.has(era.map[ty][tx]);
    }

    moveBody(era, b, dx, dy) {
      // axis-separated AABB slide, body radius 7px
      const r = 7;
      let nx = b.x + dx;
      if (!this.circleHit(era, nx, b.y, r)) b.x = nx; else { nx = b.x; }
      let ny = b.y + dy;
      if (!this.circleHit(era, nx, ny, r)) b.y = ny;
      return nx !== b.x || true;
    }

    circleHit(era, x, y, r) {
      const ts = T.TILE;
      const x0 = Math.floor((x - r) / ts), x1 = Math.floor((x + r) / ts);
      const y0 = Math.floor((y - r) / ts), y1 = Math.floor((y + r) / ts);
      for (let ty = y0; ty <= y1; ty++)
        for (let tx = x0; tx <= x1; tx++)
          if (this.solidAt(era, tx, ty)) {
            const cx = clamp(x, tx * ts, tx * ts + ts), cy = clamp(y, ty * ts, ty * ts + ts);
            if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
          }
      return false;
    }

    burst(x, y, colors, n, spd) {
      for (let i = 0; i < (n || 12); i++) {
        const a = Math.random() * Math.PI * 2, s = (spd || 90) * (0.4 + Math.random());
        this.particles.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
          life: 1, decay: 1 + Math.random(), r: 1.5 + Math.random() * 2.5,
          c: colors[(Math.random() * colors.length) | 0]
        });
      }
      if (this.particles.length > 300) this.particles.splice(0, this.particles.length - 300);
    }

    stepParticles(dt) {
      const ps = this.particles;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) ps.splice(i, 1);
      }
    }

    tileAt(era, tx, ty) {
      if (ty < 0 || ty >= era.map.length || tx < 0 || tx >= era.map[0].length) return '#';
      return era.map[ty][tx];
    }

    drawGround(era, cam) {
      const ctx = this.ctx, ts = T.TILE;
      const x0 = Math.max(0, Math.floor(cam.x / ts)), y0 = Math.max(0, Math.floor(cam.y / ts));
      const x1 = Math.min(era.map[0].length - 1, Math.ceil((cam.x + T.W) / ts));
      const y1 = Math.min(era.map.length - 1, Math.ceil((cam.y + T.H) / ts));
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const ch = era.map[ty][tx];
          const px = tx * ts - cam.x, py = ty * ts - cam.y;
          const alt = (tx + ty) % 2 === 0;
          if (ch === '~') {
            ctx.fillStyle = era.water;
            ctx.fillRect(px, py, ts, ts);
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1;
            const w1 = Math.sin(this.t * 2 + tx * 0.8 + ty) * 3;
            ctx.beginPath();
            ctx.moveTo(px + 3, py + 8 + w1); ctx.lineTo(px + ts - 3, py + 8 + w1);
            ctx.moveTo(px + 3, py + 17 - w1); ctx.lineTo(px + ts - 3, py + 17 - w1);
            ctx.stroke();
          } else {
            ctx.fillStyle = alt ? era.ground[0] : era.ground[1];
            ctx.fillRect(px, py, ts, ts);
            if (ch === ',' || ch === '*') {
              ctx.fillStyle = 'rgba(0,0,0,0.12)';
              ctx.fillRect(px + 5, py + 14, 3, 5);
              ctx.fillRect(px + 14, py + 10, 3, 6);
            }
            if (ch === '*') {
              ctx.fillStyle = era.accent;
              const tw = 0.6 + 0.4 * Math.sin(this.t * 3 + tx + ty * 2);
              ctx.globalAlpha = tw;
              ctx.fillRect(px + 6, py + 6, 4, 4);
              ctx.fillRect(px + 15, py + 15, 4, 4);
              ctx.globalAlpha = 1;
            }
            if (ch === 'o') {
              const p = 0.5 + 0.5 * Math.sin(this.t * 4);
              ctx.fillStyle = `rgba(190,170,255,${0.25 + p * 0.3})`;
              ctx.beginPath();
              ctx.ellipse(px + 12, py + 12, 10, 6, 0, 0, 6.2832);
              ctx.fill();
              ctx.strokeStyle = '#c4b5fd';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.ellipse(px + 12, py + 12, 10, 6, 0, 0, 6.2832);
              ctx.stroke();
            }
          }
        }
      }
    }

    drawProp(era, ch, px, py) {
      const ctx = this.ctx;
      switch (ch) {
        case '#':
          ctx.fillStyle = '#3d3654';
          ctx.fillRect(px, py, 24, 24);
          ctx.fillStyle = '#57507a';
          ctx.fillRect(px, py, 24, 4);
          ctx.fillRect(px, py, 4, 24);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(px + 4, py + 12, 20, 2);
          break;
        case 'T':
          ctx.fillStyle = '#5a3d2b'; ctx.fillRect(px + 10, py + 12, 5, 12);
          ctx.fillStyle = era.id === 'egypt' ? '#6a994e' : '#2d6a4f';
          ctx.beginPath(); ctx.arc(px + 12, py + 9, 10, 0, 6.2832); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.beginPath(); ctx.arc(px + 8, py + 5, 4, 0, 6.2832); ctx.fill();
          break;
        case 'R':
          ctx.fillStyle = '#8d99ae'; ctx.fillRect(px + 4, py + 12, 16, 10);
          ctx.fillStyle = '#adb5bd'; ctx.fillRect(px + 4, py + 12, 16, 4);
          break;
        case 'H':
          ctx.fillStyle = '#9c6644'; ctx.fillRect(px + 3, py + 10, 18, 13);
          ctx.fillStyle = '#7f5539';
          ctx.beginPath(); ctx.moveTo(px, py + 11); ctx.lineTo(px + 12, py); ctx.lineTo(px + 24, py + 11); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#ffd166'; ctx.fillRect(px + 9, py + 15, 6, 8);
          break;
        case 'N':
          ctx.fillStyle = '#dda15e';
          ctx.beginPath(); ctx.moveTo(px + 2, py + 22); ctx.lineTo(px + 12, py + 4); ctx.lineTo(px + 22, py + 22); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#7f5539'; ctx.fillRect(px + 10, py + 14, 4, 8);
          break;
        case 'W':
          ctx.fillStyle = '#6c757d'; ctx.fillRect(px + 4, py + 10, 16, 12);
          ctx.fillStyle = '#343a40'; ctx.fillRect(px + 7, py + 6, 10, 6);
          ctx.fillStyle = '#5a3d2b'; ctx.fillRect(px + 1, py + 2, 22, 5);
          break;
        case 'A':
          ctx.fillStyle = '#adb5bd'; ctx.fillRect(px + 5, py + 12, 14, 10);
          ctx.fillStyle = '#e9ecef'; ctx.fillRect(px + 5, py + 12, 14, 3);
          ctx.fillStyle = `rgba(255,180,80,${0.6 + 0.4 * Math.sin(this.t * 5)})`;
          ctx.beginPath(); ctx.arc(px + 12, py + 8, 4, 0, 6.2832); ctx.fill();
          break;
        case 'F': {
          const f = 0.7 + 0.3 * Math.sin(this.t * 9 + px);
          ctx.fillStyle = '#5a3d2b'; ctx.fillRect(px + 5, py + 14, 14, 8);
          ctx.fillStyle = `rgba(255,${120 + ((f * 80) | 0)},40,0.9)`;
          ctx.beginPath();
          ctx.moveTo(px + 12, py + 2); ctx.lineTo(px + 18, py + 15); ctx.lineTo(px + 6, py + 15);
          ctx.closePath(); ctx.fill();
          break;
        }
        case 'B':
          ctx.fillStyle = '#7f5539';
          ctx.beginPath(); ctx.moveTo(px + 2, py + 12); ctx.lineTo(px + 22, py + 12); ctx.lineTo(px + 18, py + 21); ctx.lineTo(px + 6, py + 21); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#5a3d2b'; ctx.fillRect(px + 11, py + 2, 2, 10);
          break;
        case 'P':
          ctx.fillStyle = '#d6ad60';
          ctx.beginPath(); ctx.moveTo(px + 12, py); ctx.lineTo(px + 24, py + 24); ctx.lineTo(px, py + 24); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath(); ctx.moveTo(px + 12, py); ctx.lineTo(px + 24, py + 24); ctx.lineTo(px + 12, py + 24); ctx.closePath(); ctx.fill();
          break;
      }
    }

    drawProps(era, cam) {
      const ts = T.TILE;
      const x0 = Math.max(0, Math.floor(cam.x / ts)), y0 = Math.max(0, Math.floor(cam.y / ts));
      const x1 = Math.min(era.map[0].length - 1, Math.ceil((cam.x + T.W) / ts));
      const y1 = Math.min(era.map.length - 1, Math.ceil((cam.y + T.H) / ts));
      for (let ty = y0; ty <= y1; ty++)
        for (let tx = x0; tx <= x1; tx++) {
          const ch = era.map[ty][tx];
          if ('TRHNWAFBP#'.includes(ch)) this.drawProp(era, ch, tx * ts - cam.x, ty * ts - cam.y);
        }
    }

    // Procedural walker: shadow, legs, robe, head, hood/hair, held item
    drawPerson(x, y, o) {
      const ctx = this.ctx;
      const bob = o.moving ? Math.sin(o.phase) * 2 : Math.sin(this.t * 2 + x) * 0.8;
      const legSwing = o.moving ? Math.sin(o.phase) * 4 : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(x, y + 10, 8, 3, 0, 0, 6.2832); ctx.fill();
      // legs
      ctx.fillStyle = '#3a2e2e';
      ctx.fillRect(x - 5, y + 2 + (o.moving ? Math.max(0, legSwing) * 0.4 : 0), 4, 8);
      ctx.fillRect(x + 1, y + 2 + (o.moving ? Math.max(0, -legSwing) * 0.4 : 0), 4, 8);
      // robe
      ctx.fillStyle = o.color;
      ctx.fillRect(x - 7, y - 8 + bob * 0.4, 14, 12);
      // arms
      ctx.fillRect(x - 9, y - 6 + (o.moving ? legSwing * 0.3 : 0), 3, 8);
      ctx.fillRect(x + 6, y - 6 + (o.moving ? -legSwing * 0.3 : 0), 3, 8);
      // head
      ctx.fillStyle = '#f1c27d';
      ctx.fillRect(x - 4, y - 15 + bob * 0.4, 8, 7);
      // hood or hair
      if (o.hood) {
        ctx.fillStyle = o.hood;
        ctx.fillRect(x - 5, y - 17 + bob * 0.4, 10, 4);
        ctx.fillRect(x - 5, y - 17 + bob * 0.4, 2, 9);
        ctx.fillRect(x + 3, y - 17 + bob * 0.4, 2, 9);
      } else {
        ctx.fillStyle = o.hair || '#4a3728';
        ctx.fillRect(x - 4, y - 16 + bob * 0.4, 8, 3);
      }
      // facing nub
      ctx.fillStyle = '#222';
      const fx = o.dir === 'l' ? -3 : o.dir === 'r' ? 3 : 0;
      const fy = o.dir === 'u' ? -1 : o.dir === 'd' ? 2 : 0;
      ctx.fillRect(x + fx - 1, y - 12 + bob * 0.4 + fy, 2, 2);
      if (o.item) {
        ctx.font = '12px serif'; ctx.textAlign = 'center';
        ctx.fillText(o.item, x + 9, y - 6 + bob * 0.4);
      }
    }

    drawBadge(x, y, emoji, marker) {
      const ctx = this.ctx;
      const by = y - 30 + Math.sin(this.t * 3 + x * 0.1) * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.arc(x, by, 10, 0, 6.2832); ctx.fill();
      ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      try { ctx.fillText(emoji, x, by + 1); } catch (e) {}
      if (marker) {
        ctx.font = 'bold 15px serif';
        ctx.fillStyle = marker === '!' ? '#ffd166' : '#8ecae6';
        try { ctx.fillText(marker, x + 12, by - 8); } catch (e) {}
        ctx.fillStyle = '#fff';
      }
      ctx.textBaseline = 'alphabetic';
    }

    drawParticles(cam) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x - cam.x, p.y - cam.y, p.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    sky(w, h, rgb) {
      const ctx = this.ctx;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`);
      g.addColorStop(1, 'rgb(6,4,18)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }

  window.AtlasEngine = Engine;
  window.ATLAS_T = T;
})();
