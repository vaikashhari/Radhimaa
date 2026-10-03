/* ============================================================
   RADHIMAA — the flower field

   Scene 06's air, and the largest of the four: flowers in three depth
   layers that open as you scroll, a petal fall several times richer
   than Scene 03's, and a few glints where the light catches.

   Same rule as the three chapters before it — **position is a pure
   function of q**. Every drift, sway and rotation is a closed-form
   curve evaluated at `u = (q − birth) / life`, so scrolling back
   un-blooms the field through exactly the frames it came through.

   The exception is the same one, and for the same reason: sway and
   glint carry a small clock term, because a flower held perfectly
   still is a sticker. It moves nothing by more than its own breath,
   and under `prefers-reduced-motion` it is switched off entirely.

   The blend is `source-over`, not `lighter`. Scene 05's night wanted
   additive light; this chapter's ground is a burning sky at L 95-197
   over a crowd at L 1-40, and a flower has to be an object on both.
   Which is why every petal carries a dark rim, clipped to its own
   silhouette — the same lesson Scene 04's butterflies taught against
   its sky.
   ============================================================ */
(function () {
  'use strict';

  var R = window.Radhimaa;
  if (!R) return;

  var util = R.util;
  var clamp01 = util.clamp01, pick = util.pick, ease = util.ease;
  var TAU = Math.PI * 2;

  var CAN_FILTER = (function () {
    try {
      var c = document.createElement('canvas').getContext('2d');
      c.filter = 'blur(2px)';
      return c.filter === 'blur(2px)';
    } catch (e) { return false; }
  })();

  /* ------------------------------------------------------------
     THE FLOWER

     Two rings of teardrop petals around a warm eye. A bud is not a
     small flower — it is a wound one, so the petals start narrow,
     overlapping and twisted, and unwind as they open. Checked at
     190 / 110 / 64 / 38 px across six stages, on the burning sky and
     on the dark crowd, before any of it went into the chapter.
     ------------------------------------------------------------ */
  var RING = [
    { n: 8, phase: 0.00, twist:  0.95, d0: 0.00, d1: 0.24, l0: 0.30, l1: 0.62, w0: 0.055, w1: 0.30 },
    { n: 6, phase: 0.42, twist: -0.75, d0: 0.00, d1: 0.13, l0: 0.22, l1: 0.40, w0: 0.048, w1: 0.22 }
  ];
  var STAGES = 6;

  function teardrop(c, ang, dist, len, wid, rim, rimW) {
    c.save();
    c.rotate(ang);
    c.beginPath();
    c.moveTo(0, -dist);
    c.bezierCurveTo(wid, -dist - len * 0.30, wid * 0.86, -dist - len * 0.86, 0, -dist - len);
    c.bezierCurveTo(-wid * 0.86, -dist - len * 0.86, -wid, -dist - len * 0.30, 0, -dist);
    c.closePath();
    c.fill();
    if (rim) {
      /* clipped, so the outer half of the stroke never lands outside
         the petal — unclipped it leaves a fringe against the sky */
      c.save(); c.clip(); c.strokeStyle = rim; c.lineWidth = rimW; c.stroke(); c.restore();
    }
    c.restore();
  }

  function bakeFlower(tone, stage, soft, S, dpr) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = S * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    /* soft enough to sit in front of the lens, sharp enough to still
       be a flower — at 0.022 the foreground layer read as blobs */
    if (soft && CAN_FILTER) c.filter = 'blur(' + (S * 0.013).toFixed(2) + 'px)';

    var Rr = S * 0.46;
    var s = stage / (STAGES - 1);
    c.translate(S / 2, S / 2);

    for (var r = RING.length - 1; r >= 0; r--) {
      var ring = RING[r];
      var dist = Rr * (ring.d0 + (ring.d1 - ring.d0) * s);
      var len  = Rr * (ring.l0 + (ring.l1 - ring.l0) * s);
      var wid  = Rr * (ring.w0 + (ring.w1 - ring.w0) * s);
      var g = c.createRadialGradient(0, 0, 0, 0, 0, Rr);
      /* The pale core is a highlight, not the petal. At a 0.55
          midpoint it swallowed the whole shape and every flower read
          as a translucent decal on the sky. */
      g.addColorStop(0.00, tone.core);
      g.addColorStop(0.30, tone.mid);
      g.addColorStop(0.72, tone.mid2);
      g.addColorStop(1.00, tone.edge);
      c.fillStyle = g;
      var tw = ring.twist * (1 - s);
      for (var i = 0; i < ring.n; i++) {
        teardrop(c, (i / ring.n) * TAU + ring.phase + tw, dist, len, wid, tone.rim, S * 0.055);
      }
    }
    var eg = c.createRadialGradient(0, 0, 0, 0, 0, Rr * 0.22);
    eg.addColorStop(0, tone.eye);
    eg.addColorStop(1, tone.eye0);
    c.fillStyle = eg;
    c.beginPath();
    c.arc(0, 0, Rr * 0.22 * (0.4 + s * 0.6), 0, TAU);
    c.fill();
    return cv;
  }

  /* ------------------------------------------------------------
     THE PETAL — the shadow trick, as in the two chapters before.
     Three light levels per tone: this frame's light is the sunset
     sky, so a petal high in the frame is lit and one down among the
     crowd is not, and the level it picks is what §07 means by the
     light reaching them.
     ------------------------------------------------------------ */
  function petalPath(c, w, h) {
    c.beginPath();
    c.moveTo(0, -h);
    c.bezierCurveTo(w * 1.05, -h * 0.50, w * 0.84, h * 0.46, 0, h);
    c.bezierCurveTo(-w * 0.82, h * 0.42, -w * 0.98, -h * 0.44, 0, -h);
    c.closePath();
  }

  function hx(c) {
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  }
  function mix(a, b, t) {
    var x = hx(a), y = hx(b);
    return 'rgba(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' +
                     Math.round(x[1] + (y[1] - x[1]) * t) + ',' +
                     Math.round(x[2] + (y[2] - x[2]) * t) + ',';
  }

  function bakePetal(deep, bright, lit, S, dpr) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = S * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    var off = S * 2, cx = S / 2, cy = S / 2;
    var w = S * 0.19, h = S * 0.29;
    var body = mix(deep, bright, 0.42 + lit * 0.50);
    var core = mix(bright, '#fffaf2', 0.14 + lit * 0.34);

    function blob(path, colour, alpha, blur, dx, dy) {
      c.save();
      c.shadowColor = colour + alpha + ')';
      c.shadowBlur = blur;
      c.shadowOffsetX = off;
      c.fillStyle = '#000';
      c.translate(cx - off + dx, cy + dy);
      path(c); c.fill();
      c.restore();
    }
    if (lit > 0.4) {
      blob(function (g) { petalPath(g, w * 1.42, h * 1.32); },
           body, (0.05 + lit * 0.12).toFixed(3), S * 0.19, 0, 0);
    }
    blob(function (g) { petalPath(g, w, h); },
         body, (0.90 + lit * 0.08).toFixed(3), S * 0.052, 0, 0);
    blob(function (g) { petalPath(g, w * 0.46, h * 0.56); },
         core, (0.16 + lit * 0.22).toFixed(3), S * 0.046, w * 0.14, -h * 0.10);
    return cv;
  }

  function bakeGlint(rgb, S, dpr) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = S * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    var h = S / 2;
    var g = c.createRadialGradient(h, h, 0, h, h, h);
    g.addColorStop(0.00, rgb + '1)');
    g.addColorStop(0.08, rgb + '.70)');
    g.addColorStop(0.26, rgb + '.20)');
    g.addColorStop(1.00, rgb + '0)');
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    return cv;
  }

  /* ------------------------------------------------------------
     R.bloom(opts)
     ------------------------------------------------------------ */
  R.bloom = function (opts) {
    var backC = opts.back, frontC = opts.front;
    if (!backC || !backC.getContext) return null;
    var bx = backC.getContext('2d');
    var fx = frontC ? frontC.getContext('2d') : null;
    if (!bx) return null;

    var REDUCED = R.reduced;
    var S_FLOW = 80, S_PET = 46, S_GLINT = 40;

    /* Sampled beside the plate: her sari, his linen, the dais, and the
       sky itself. §02's palette, minus the green — there is none in
       this footage and forcing it in would be the one colour that did
       not come from the film. */
    var FTONE = [
      { core: 'rgba(255,244,232,1)', mid: 'rgba(250,190,192,1)', mid2: 'rgba(228,140,150,1)',
        edge: 'rgba(176,80,94,1)',
        eye: 'rgba(255,206,132,.92)', eye0: 'rgba(255,206,132,0)', rim: 'rgba(118,42,58,.52)' },
      { core: 'rgba(255,248,236,1)', mid: 'rgba(246,220,182,1)', mid2: 'rgba(226,186,132,1)',
        edge: 'rgba(174,128,74,1)',
        eye: 'rgba(255,188,104,.88)', eye0: 'rgba(255,188,104,0)', rim: 'rgba(112,74,34,.48)' },
      { core: 'rgba(255,238,226,1)', mid: 'rgba(255,178,142,1)', mid2: 'rgba(238,132,98,1)',
        edge: 'rgba(182,76,54,1)',
        eye: 'rgba(255,216,158,.88)', eye0: 'rgba(255,216,158,0)', rim: 'rgba(116,38,26,.50)' },
      { core: 'rgba(249,244,255,1)', mid: 'rgba(216,200,242,1)', mid2: 'rgba(180,158,222,1)',
        edge: 'rgba(122,100,172,1)',
        eye: 'rgba(255,220,170,.82)', eye0: 'rgba(255,220,170,0)', rim: 'rgba(60,44,104,.50)' }
    ];
    var PTONE = [
      ['#a84a56', '#f8c4c4'],
      ['#9a6a3a', '#f6e2c4'],
      ['#b0553a', '#ffb99a'],
      ['#6d5a9a', '#ded0f2']
    ];
    var PLEV = 3;
    var GTONE = ['rgba(255,232,190,', 'rgba(255,206,214,'];

    var fSprite = null, fSoft = null, pSprite = null, gSprite = null;
    var dpr = 1, cw = 0, ch = 0, map = null;
    var flowers = [], petals = [], fore = [], glints = [], clock = 0;
    var blank = false;
    var BAND = !!opts.band;

    function remap() {
      var p = opts.plate;
      var s = Math.max(cw / p.w, ch / p.h);
      var dw = p.w * s, dh = p.h * s;
      var ox = (cw - dw) * (p.ox != null ? p.ox : 0.5);
      var oy = (ch - dh) * (p.oy != null ? p.oy : 0.5);
      var b = opts.band;
      var by = b ? oy + dh * b.top : oy;
      var bh = b ? dh * b.height : dh;
      map = {
        x: function (v) { return ox + dw * v * 0.01; },
        y: function (v) { return by + bh * v * 0.01; },
        s: bh * 0.01
      };
    }

    /* The two of them stand at x 39-41% for almost the whole plate.
       Background and midground thin across that column, which is what
       reads as being behind them; the foreground does not, because a
       flower passing the lens belongs in front of everything. */
    var AV = opts.avoid || { x0: 30, x1: 58, y0: 22, y1: 78 };
    function offSubject(fxp, fyp) {
      if (fxp < AV.x0 || fxp > AV.x1 || fyp < AV.y0 || fyp > AV.y1) return 1;
      var mx = 1 - Math.abs(fxp - (AV.x0 + AV.x1) * 0.5) / ((AV.x1 - AV.x0) * 0.5);
      var my = 1 - Math.abs(fyp - (AV.y0 + AV.y1) * 0.5) / ((AV.y1 - AV.y0) * 0.5);
      return 1 - 0.62 * mx * my;
    }

    /* §07 — the light in this frame is the sunset, and it is above.
       A flower high in the frame is lit and one down among the crowd
       is not. One expression, and it decides both the petal sprite
       and how bright anything is drawn. */
    function litAt(fyp, g) {
      return clamp01((0.15 + 0.85 * clamp01((72 - fyp) / 58)) * (0.55 + g * 0.45));
    }

    /* ---------- the pool ---------- */
    function build() {
      var rnd = util.rng(opts.seed || 6);
      var c = opts.counts;
      flowers.length = 0; petals.length = 0; fore.length = 0; glints.length = 0;
      var i, t, dep;

      function flock(n, layer, from, to, power) {
        for (var k = 0; k < n; k++) {
          var tt = n < 2 ? 0 : k / (n - 1);
          flowers.push({
            layer: layer,
            birth: from + (to - from) * Math.pow(tt, power) + pick(rnd, -0.02, 0.02),
            life: layer === 2 ? pick(rnd, 0.16, 0.30)
                : layer === 1 ? pick(rnd, 0.26, 0.48)
                              : pick(rnd, 0.30, 0.56),
            /* §05 — the opening is slow and takes a good third of the
               flower's life. Fast is the one thing it must not be. */
            open: pick(rnd, 0.30, 0.48),
            x0: pick(rnd, -6, 106),
            y0: pick(rnd, -8, 104),
            ax: layer === 2 ? pick(rnd, -10, 10) : pick(rnd, -5, 5),
            ay: layer === 2 ? pick(rnd, -16, 8) : pick(rnd, -11, 5),
            sway: layer === 0 ? pick(rnd, 0.5, 1.8) : pick(rnd, 1.0, 3.2),
            swf: pick(rnd, 0.4, 1.5),
            swp: pick(rnd, 0, TAU),
            rot: pick(rnd, 0, TAU),
            spin: pick(rnd, -0.5, 0.5),
            /* A rosette drawn square-on is a decal. Squashing one axis
               reads as a flower seen at an angle, and a field of them
               at different angles stops looking like stickers laid on
               the frame. Costs nothing — it is the same transform. */
            tilt: pick(rnd, 0.52, 1.0),
            sz: layer === 2 ? pick(rnd, 1.9, 3.4)
              : layer === 1 ? pick(rnd, 0.62, 1.72)
                            : pick(rnd, 0.28, 0.78),
            op: layer === 2 ? pick(rnd, 0.44, 0.70)
              : layer === 1 ? pick(rnd, 0.86, 1.00)
                            : pick(rnd, 0.48, 0.80),
            tone: (rnd() * FTONE.length) | 0,
            zoom: layer === 2 ? pick(rnd, 0.25, 0.85) : pick(rnd, -0.05, 0.16)
          });
        }
      }

      /* Background first and thinnest at the start; the midground is
         the chapter; the foreground arrives late and rarely. */
      flock(c.far,  0, 0.150, 0.740, 1.30);
      flock(c.mid,  1, 0.210, 0.760, 1.25);
      /* the foreground stops arriving well before the close-up: a
         large soft bloom crossing the lens is right in the middle of
         the chapter and a blob in front of its last frame */
      flock(c.near, 2, 0.340, 0.700, 1.10);

      /* --- petals ---
         §06 asks for significantly more than Scene 03, which peaked
         near 260 on screen. Spread across the whole runway so the
         fall is continuous rather than arriving in waves, with depth
         from rnd()*rnd() the same way. */
      var n = c.petal;
      for (i = 0; i < n; i++) {
        t = n < 2 ? 0 : i / (n - 1);
        dep = rnd() * rnd();
        petals.push({
          birth: 0.160 + 0.690 * t + pick(rnd, -0.03, 0.03),
          life: pick(rnd, 0.18, 0.44),
          x0: pick(rnd, -8, 108),
          y0: pick(rnd, -22, -2),
          vx: pick(rnd, -24, 16),
          vy: pick(rnd, 62, 140) * (0.7 + dep * 0.85),
          sway: pick(rnd, 2, 8), swf: pick(rnd, 0.8, 2.5), swp: pick(rnd, 0, TAU),
          r0: pick(rnd, 0, TAU), spin: pick(rnd, -2.6, 2.6),
          tum: pick(rnd, 0, TAU), tsp: pick(rnd, 1.3, 4.4),
          sz: 0.26 + dep * 1.45,
          ar: pick(rnd, 0.70, 1.30),
          tone: (rnd() * PTONE.length) | 0,
          dim: pick(rnd, 0.50, 1) * (1 - dep * 0.42)
        });
      }

      /* a few large, soft ones past the lens */
      for (i = 0; i < c.fore; i++) {
        fore.push({
          birth: 0.320 + 0.500 * (i / Math.max(1, c.fore - 1)) + pick(rnd, -0.04, 0.04),
          life: pick(rnd, 0.10, 0.20),
          x0: pick(rnd, -10, 110), y0: pick(rnd, -26, -6),
          vx: pick(rnd, -28, 20), vy: pick(rnd, 130, 215),
          sway: pick(rnd, 3, 9), swf: pick(rnd, 0.7, 1.8), swp: pick(rnd, 0, TAU),
          r0: pick(rnd, 0, TAU), spin: pick(rnd, -1.8, 1.8),
          tum: pick(rnd, 0, TAU), tsp: pick(rnd, 1.0, 2.6),
          sz: pick(rnd, 2.4, 4.6),
          ar: pick(rnd, 0.80, 1.25),
          tone: (rnd() * PTONE.length) | 0,
          dim: pick(rnd, 0.14, 0.30)
        });
      }

      /* §08 — glints, and only glints. The plate already carries a
         chandelier and a burning sky; adding light trails and line art
         on top of that is the clutter §12 rules out. They sit high,
         where the light is. */
      for (i = 0; i < (REDUCED ? 0 : c.spark); i++) {
        t = c.spark < 2 ? 0 : i / (c.spark - 1);
        glints.push({
          birth: 0.300 + 0.540 * t + pick(rnd, -0.03, 0.03),
          life: pick(rnd, 0.05, 0.12),
          x: pick(rnd, 2, 98),
          y: pick(rnd, 2, 56),
          sz: pick(rnd, 0.14, 0.40),
          op: pick(rnd, 0.40, 0.95),
          tone: (rnd() * GTONE.length) | 0
        });
      }
    }

    /* ---------- sizing ---------- */
    function bakeAll() {
      var t, s2;
      fSprite = []; fSoft = [];
      for (t = 0; t < FTONE.length; t++) {
        var row = [], rowS = [];
        for (s2 = 0; s2 < STAGES; s2++) {
          row.push(bakeFlower(FTONE[t], s2, false, S_FLOW, dpr));
          rowS.push(bakeFlower(FTONE[t], s2, true, S_FLOW, dpr));
        }
        fSprite.push(row); fSoft.push(rowS);
      }
      pSprite = [];
      for (t = 0; t < PTONE.length; t++) {
        var pr = [];
        for (s2 = 0; s2 < PLEV; s2++) pr.push(bakePetal(PTONE[t][0], PTONE[t][1], s2 / (PLEV - 1), S_PET, dpr));
        pSprite.push(pr);
      }
      gSprite = [];
      for (t = 0; t < GTONE.length; t++) gSprite.push(bakeGlint(GTONE[t], S_GLINT, dpr));
    }

    function resize() {
      var r = backC.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width));
      var h = Math.max(1, Math.round(r.height));
      var d = Math.min(window.devicePixelRatio || 1, 2);
      if (w === cw && h === ch && d === dpr && fSprite) return;
      cw = w; ch = h;
      if (d !== dpr || !fSprite) { dpr = d; bakeAll(); }
      backC.width = Math.round(cw * dpr);
      backC.height = Math.round(ch * dpr);
      if (frontC) { frontC.width = backC.width; frontC.height = backC.height; }
      remap();
      blank = false;
    }

    /* ---------- draw ---------- */
    function seam(fyp) {
      if (!BAND) return 1;
      return fyp < 7 ? (fyp + 7) * 0.0714 : fyp > 93 ? (107 - fyp) * 0.0714 : 1;
    }

    function drawPetal(ctx, p, u, alpha, lit) {
      var fxp = p.x0 + p.vx * u + p.sway * Math.sin(p.swf * u * TAU + p.swp);
      var fyp = p.y0 + p.vy * u;
      if (fyp < -30 || fyp > 132 || fxp < -20 || fxp > 120) return;
      var s = p.sz * S_PET * map.s * 0.11;
      var tw = (0.26 + 0.74 * Math.abs(Math.cos(p.tum + p.tsp * u * TAU))) * p.ar;
      var rot = p.r0 + p.spin * u;
      var co = Math.cos(rot), si = Math.sin(rot);
      var lv = (lit * (PLEV - 1) + 0.5) | 0;
      if (lv > PLEV - 1) lv = PLEV - 1;
      ctx.globalAlpha = alpha;
      ctx.setTransform(dpr * co * tw, dpr * si * tw, dpr * -si, dpr * co,
                       dpr * map.x(fxp), dpr * map.y(fyp));
      ctx.drawImage(pSprite[p.tone][lv], -s * 0.5, -s * 0.5, s, s);
    }

    function drawFlower(ctx, f, u, lv) {
      var sw = f.sway * Math.sin(f.swf * (u * 5 + clock * 0.5) * TAU + f.swp);
      var fxp = f.x0 + f.ax * u + sw;
      var fyp = f.y0 + f.ay * u + sw * 0.32;
      if (fyp < -22 || fyp > 122 || fxp < -20 || fxp > 120) return;

      var edge = u < 0.10 ? u / 0.10 : u > 0.80 ? (1 - u) / 0.20 : 1;
      var g = litAt(fyp, lv.lit);
      var a = f.op * edge * lv.flower * lv.all * (0.64 + g * 0.36) * seam(fyp);
      if (f.layer !== 2) a *= offSubject(fxp, fyp);
      if (a < 0.005) return;

      var s = f.sz * S_FLOW * (1 + f.zoom * u) * (map.s * 0.11);
      if (s < 2) return;

      /* §05 — the bloom. Two adjacent stages cross-faded, so the
         opening is continuous rather than stepping through six
         drawings of the same flower. */
      var st = clamp01(u / f.open);
      var fs = ease(st) * (STAGES - 1);
      var i0 = fs | 0, i1 = i0 + 1 > STAGES - 1 ? STAGES - 1 : i0 + 1;
      var mixf = fs - i0;

      var rot = f.rot + f.spin * u;
      var co = Math.cos(rot), si = Math.sin(rot), tl = f.tilt;
      var set = f.layer === 2 ? fSoft : fSprite;
      /* rotate, then squash the minor axis */
      ctx.setTransform(dpr * co, dpr * si, dpr * -si * tl, dpr * co * tl,
                       dpr * map.x(fxp), dpr * map.y(fyp));
      if (mixf > 0.01 && i1 !== i0) {
        ctx.globalAlpha = a * (1 - mixf);
        ctx.drawImage(set[f.tone][i0], -s * 0.5, -s * 0.5, s, s);
        ctx.globalAlpha = a * mixf;
        ctx.drawImage(set[f.tone][i1], -s * 0.5, -s * 0.5, s, s);
      } else {
        ctx.globalAlpha = a;
        ctx.drawImage(set[f.tone][i0], -s * 0.5, -s * 0.5, s, s);
      }
    }

    function draw(q, t) {
      if (!map) return;
      clock = t;
      var lv = opts.levels(q);
      var i, p, u;

      if (lv.all <= 0.002) {
        if (!blank) {
          bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, backC.width, backC.height);
          if (fx) { fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, frontC.width, frontC.height); }
          blank = true;
        }
        return;
      }
      blank = false;

      bx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bx.clearRect(0, 0, cw, ch);
      if (fx) { fx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.clearRect(0, 0, cw, ch); }

      /* --- background flowers --- */
      for (i = 0; i < flowers.length; i++) {
        p = flowers[i];
        if (p.layer !== 0) continue;
        u = (q - p.birth) / p.life;
        if (u > 0 && u < 1) drawFlower(bx, p, u, lv);
      }

      /* --- petals --- */
      if (lv.petal > 0.004) {
        for (i = 0; i < petals.length; i++) {
          p = petals[i];
          u = (q - p.birth) / p.life;
          if (u <= 0 || u >= 1) continue;
          var pfy = p.y0 + p.vy * u;
          var lit = litAt(pfy, lv.lit);
          var pe = u < 0.10 ? u / 0.10 : u > 0.76 ? (1 - u) / 0.24 : 1;
          var pa = pe * p.dim * lv.petal * seam(pfy);
          if (pa > 0.004) drawPetal(bx, p, u, pa > 1 ? 1 : pa, lit);
        }
      }

      /* --- midground flowers, over the petals --- */
      for (i = 0; i < flowers.length; i++) {
        p = flowers[i];
        if (p.layer !== 1) continue;
        u = (q - p.birth) / p.life;
        if (u > 0 && u < 1) drawFlower(bx, p, u, lv);
      }

      /* --- glints, additive, high in the frame --- */
      if (lv.spark > 0.004) {
        bx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bx.globalCompositeOperation = 'lighter';
        for (i = 0; i < glints.length; i++) {
          p = glints[i];
          u = (q - p.birth) / p.life;
          if (u <= 0 || u >= 1) continue;
          var ga = p.op * Math.sin(u * Math.PI) * lv.spark * lv.all * seam(p.y);
          if (ga < 0.006) continue;
          var gs = p.sz * S_GLINT * (0.4 + Math.sin(u * Math.PI) * 0.85) * (map.s * 0.11);
          bx.globalAlpha = ga > 1 ? 1 : ga;
          bx.drawImage(gSprite[p.tone], map.x(p.x) - gs * 0.5, map.y(p.y) - gs * 0.5, gs, gs);
        }
        bx.globalCompositeOperation = 'source-over';
      }

      bx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bx.globalAlpha = 1;

      /* --- the foreground, above the typography --- */
      if (fx) {
        for (i = 0; i < fore.length; i++) {
          p = fore[i];
          u = (q - p.birth) / p.life;
          if (u <= 0 || u >= 1) continue;
          var fe = u < 0.18 ? u / 0.18 : u > 0.70 ? (1 - u) / 0.30 : 1;
          var fa = fe * p.dim * lv.petal * seam(p.y0 + p.vy * u);
          if (fa > 0.004) drawPetal(fx, p, u, fa, 0.85);
        }
        for (i = 0; i < flowers.length; i++) {
          p = flowers[i];
          if (p.layer !== 2) continue;
          u = (q - p.birth) / p.life;
          if (u > 0 && u < 1) drawFlower(fx, p, u, lv);
        }
        fx.setTransform(dpr, 0, 0, dpr, 0, 0);
        fx.globalAlpha = 1;
      }
    }

    function stats(q) {
      var lv = opts.levels(q), o = { far: 0, mid: 0, near: 0, petal: 0, fore: 0, spark: 0 };
      var i, u;
      for (i = 0; i < flowers.length; i++) {
        u = (q - flowers[i].birth) / flowers[i].life;
        if (u <= 0 || u >= 1 || lv.flower * lv.all < 0.02) continue;
        if (flowers[i].layer === 0) o.far++; else if (flowers[i].layer === 1) o.mid++; else o.near++;
      }
      for (i = 0; i < petals.length; i++) {
        u = (q - petals[i].birth) / petals[i].life;
        if (u > 0 && u < 1 && lv.petal > 0.02) o.petal++;
      }
      for (i = 0; i < fore.length; i++) {
        u = (q - fore[i].birth) / fore[i].life;
        if (u > 0 && u < 1 && lv.petal > 0.02) o.fore++;
      }
      for (i = 0; i < glints.length; i++) {
        u = (q - glints[i].birth) / glints[i].life;
        if (u > 0 && u < 1 && lv.spark * lv.all > 0.02) o.spark++;
      }
      return o;
    }

    build();
    resize();

    return {
      draw: draw,
      resize: resize,
      stats: stats,
      rebuild: function () { build(); resize(); }
    };
  };
})();
