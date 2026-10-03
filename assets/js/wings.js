/* ============================================================
   RADHIMAA — the butterfly world

   Scene 04's air: butterflies in three depth layers, rose petals,
   light motes, and one hidden thing. It is built on the same rule
   as Scene 03's petal field — **position is a pure function of q** —
   with one deliberate exception, noted below.

   Everything a butterfly does to get from one side of the frame to
   the other is a closed-form curve evaluated at
   `u = (q − birth) / life`. Scroll forward and it flies; scroll back
   and it un-flies through exactly the frames it came through. No
   integration, so nothing to un-integrate.

   **The exception is the wingbeat.** It carries a slow clock term as
   well as a scroll term, because a butterfly held mid-air with its
   wings stopped reads as a sticker, not a held frame. The wings are
   the one thing in the chapter that keeps breathing when the film
   stops — which is the same licence Scenes 02, 03, 05 and 06 already
   take with their dust, bokeh and embers. It moves no butterfly by a
   pixel: every trajectory is still exactly reversible.

   Two canvases, not one. The typography has to sit *inside* the
   swarm rather than on top of it, so the far and mid layers draw
   below the type and the near layer draws above it. That is the only
   way to get a butterfly to pass in front of a word and another to
   pass behind it in the same frame.
   ============================================================ */
(function () {
  'use strict';

  var R = window.Radhimaa;
  if (!R) return;

  var util = R.util;
  var clamp01 = util.clamp01, pick = util.pick;
  var TAU = Math.PI * 2;

  /* Canvas 2D `filter` is what makes a foreground butterfly read as
     out of focus rather than merely large. It is baked once, so the
     cost is irrelevant; where it is missing the sprite is stacked
     instead, which is coarser but never wrong. */
  var CAN_FILTER = (function () {
    try {
      var c = document.createElement('canvas').getContext('2d');
      c.filter = 'blur(2px)';
      return c.filter === 'blur(2px)';
    } catch (e) { return false; }
  })();

  /* ------------------------------------------------------------
     THE BUTTERFLY

     The same creature Scene 02 introduced and Scene 04 already flew,
     lifted out of `R.util.butterfly`'s SVG so the two read as one
     species. Path2D takes the path data directly, so the shape is
     defined once and in one notation.

     The viewBox is 60x44 with the body vertical and the head at the
     top, which is what lets a heading be applied as a plain rotation.
     ------------------------------------------------------------ */
  var VB = 100, VCY = 44;

  /* Forewings swept and pointed, hindwings smaller and rounded — the
     proportion is what makes a butterfly read as a butterfly at 40
     pixels. Scene 02's four near-equal wings were fine as a dark
     silhouette on a bright frame, but filled with colour and shrunk
     to flight size they read as a four-petalled flower. Checked at
     360 / 150 / 86 / 52 / 34 px, open and mid-beat, before shipping. */
  var WING = [
    'M52 30 C 59 15, 75 3, 92 4 C 99 7, 96 31, 78 45 C 68 51, 56 48, 52 41 Z',
    'M53 46 C 67 47, 82 56, 79 69 C 76 82, 61 85, 55 70 C 52 62, 52 53, 53 46 Z',
    'M48 30 C 41 15, 25 3, 8 4 C 1 7, 4 31, 22 45 C 32 51, 44 48, 48 41 Z',
    'M47 46 C 33 47, 18 56, 21 69 C 24 82, 39 85, 45 70 C 48 62, 48 53, 47 46 Z'
  ];
  /* Antennae cost two strokes and do more for the read than anything
     else on the creature. */
  var ANT = [
    'M48 22 C 44 13, 38 7, 32 4',
    'M52 22 C 56 13, 62 7, 68 4'
  ];
  var BODY = 'M50 15 C 53 16, 54 22, 53 29 C 54 44, 53 64, 50 80 ' +
             'C 47 64, 46 44, 47 29 C 46 22, 47 16, 50 15 Z';

  var WINGP = null, ANTP = null, BODYP = null;

  function shape() {
    if (!WINGP) {
      WINGP = []; ANTP = [];
      for (var i = 0; i < WING.length; i++) WINGP.push(new Path2D(WING[i]));
      for (var j = 0; j < ANT.length; j++) ANTP.push(new Path2D(ANT[j]));
      BODYP = new Path2D(BODY);
    }
    return WINGP;
  }

  function bakeFly(rim, edge, core, soft, S, dpr) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = S * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);

    /* Soft enough to sit in front of the lens, sharp enough to still
       be a butterfly — at 0.030 the foreground layer read as pale
       smudges rather than as anything with wings. */
    if (soft && CAN_FILTER) c.filter = 'blur(' + (S * 0.019).toFixed(2) + 'px)';

    var k = S / 112;                      /* a little air around it */
    c.translate(S / 2 - (VB / 2) * k, S / 2 - VCY * k);
    c.scale(k, k);

    var paths = shape();
    var passes = (soft && !CAN_FILTER) ? 3 : 1;
    var i;

    for (var pass = 0; pass < passes; pass++) {
      c.save();
      if (passes > 1) {
        c.globalAlpha = 0.5;
        c.translate(50, 44); c.scale(1 + pass * 0.05, 1 + pass * 0.05); c.translate(-50, -44);
      }
      /* Lit toward the body and deep at the tips — which is how a real
         one catches light, and it is what stops four filled shapes
         reading as cut paper. §03 rules out flat red and flat blue. */
      var g = c.createLinearGradient(2, 0, VB - 2, 0);
      g.addColorStop(0.00, edge);
      g.addColorStop(0.30, core);
      g.addColorStop(0.50, core);
      g.addColorStop(0.70, core);
      g.addColorStop(1.00, edge);
      c.fillStyle = g;
      for (i = 0; i < paths.length; i++) c.fill(paths[i]);

      /* The dark margin almost every butterfly has. Stroked wide but
         clipped to its own wing, so the outer half of the line never
         lands outside the silhouette — an unclipped stroke leaves a
         grey fringe against the sky, which is what the first cut did. */
      c.strokeStyle = rim;
      c.lineWidth = 8;
      for (i = 0; i < paths.length; i++) {
        c.save(); c.clip(paths[i]); c.stroke(paths[i]); c.restore();
      }

      /* thin: at 1.6 they merged with the body into a dark bar the
         moment the sprite was rotated off vertical */
      c.strokeStyle = 'rgba(30,10,22,.52)';
      c.lineWidth = 1.05;
      c.lineCap = 'round';
      for (i = 0; i < ANTP.length; i++) c.stroke(ANTP[i]);

      c.fillStyle = 'rgba(28,12,22,.86)';
      c.fill(BODYP);
      c.restore();
    }
    return cv;
  }

  /* ------------------------------------------------------------
     THE ROSE PETAL
     Softness from the shadow rather than from `filter`, so it is
     identical everywhere. Three light levels per tone: a petal low
     in the frame is in the crowd's warm bounce, one high in it is in
     sky light, and the level it picks is what "catching the light"
     means here.
     ------------------------------------------------------------ */
  function petalPath(c, w, h) {
    c.beginPath();
    c.moveTo(0, -h);
    c.bezierCurveTo(w * 1.06, -h * 0.50, w * 0.84, h * 0.46, 0, h);
    c.bezierCurveTo(-w * 0.82, h * 0.42, -w * 0.98, -h * 0.44, 0, -h);
    c.closePath();
  }

  function hex(c) {
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  }
  function mix(a, b, t) {
    var x = hex(a), y = hex(b);
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
    /* The body carries the colour and very nearly all of the opacity.
       An earlier cut had a dark body under a much paler core and every
       petal baked as a ring — a dark rim with a light hole in it —
       because the only place the body showed was where the core did
       not. The core is a lift now, not a second colour. */
    var body = mix(deep, bright, 0.46 + lit * 0.44);
    var core = mix(bright, '#fff2f2', 0.16 + lit * 0.30);

    function blob(path, colour, alpha, blur, dx, dy) {
      c.save();
      c.shadowColor = colour + alpha + ')';
      c.shadowBlur = blur;
      c.shadowOffsetX = off;
      c.fillStyle = '#000';
      c.translate(cx - off + dx, cy + dy);
      path(c);
      c.fill();
      c.restore();
    }

    if (lit > 0.4) {
      blob(function (g) { petalPath(g, w * 1.45, h * 1.35); },
           body, (0.05 + lit * 0.11).toFixed(3), S * 0.19, 0, 0);
    }
    blob(function (g) { petalPath(g, w, h); },
         body, (0.88 + lit * 0.10).toFixed(3), S * 0.055, 0, 0);
    blob(function (g) { petalPath(g, w * 0.46, h * 0.56); },
         core, (0.16 + lit * 0.20).toFixed(3), S * 0.048, w * 0.14, -h * 0.10);
    return cv;
  }

  function bakeMote(colour, S, dpr) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = S * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    var g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, colour + '.95)');
    g.addColorStop(0.30, colour + '.34)');
    g.addColorStop(1, colour + '0)');
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    return cv;
  }

  /* ------------------------------------------------------------
     R.wings(opts)

       back, front   the two canvases the type is sandwiched between
       plate         { w, h, ox, oy } for the cover mapping
       band          { top, height } for a portrait plate
       seed          deterministic
       counts        { far, mid, near, petal, fore, mote }
       levels(q)     { all, red, blue, petal, mote, morph }
       petalBeats    [{ q, n, power }]
       heart         { q, life, x, y, r, n }
       avoid         { x0, x1, yTop }  the couple's column
     ------------------------------------------------------------ */
  R.wings = function (opts) {
    var backC = opts.back, frontC = opts.front;
    if (!backC || !backC.getContext) return null;

    var bx2 = backC.getContext('2d');
    var fx2 = frontC ? frontC.getContext('2d') : null;
    if (!bx2) return null;

    var REDUCED = R.reduced;
    var S_FLY = 60, S_PET = 44, S_MOTE = 34;

    /* Four reds and four blues. The brief asked for crimson, ruby,
       rose, burgundy against deep blue, midnight, sapphire and
       blue-violet, and they are held apart far enough that a swarm
       of them does not average out to one colour. */
    var FLY_TONE = [
      /* Lifted from a first cut that measured fine and read wrong: at
         flight size a dark red butterfly on a blue sky is
         indistinguishable from a dark red petal, and the chapter has
         hundreds of those. Wings have to be brighter than the debris
         they share the air with. */
      /* [ margin, edge, core ] */
      ['rgba(74,6,20,.55)',   '#8e1024', '#f4526a'],   /* crimson  */
      ['rgba(60,4,18,.58)',   '#780c24', '#e0304e'],   /* ruby     */
      ['rgba(120,26,48,.48)', '#b03050', '#ff92a8'],   /* rose     */
      ['rgba(48,4,14,.60)',   '#5e0c1e', '#b02440'],   /* burgundy */
      ['rgba(8,14,58,.55)',   '#14225e', '#4a76de'],   /* sapphire */
      ['rgba(4,6,30,.60)',    '#0a1140', '#2a3f96'],   /* midnight */
      ['rgba(12,44,80,.50)',  '#1c4f7e', '#63b0e2'],   /* cyan-blue */
      ['rgba(28,16,74,.52)',  '#33227e', '#8a7cec']    /* blue-violet */
    ];
    var FIRST_BLUE = 4;

    var PET_TONE = [
      ['#6b0d1c', '#b81f33'],
      ['#b23a52', '#ef7f92'],
      ['#3d0812', '#7d1428'],
      ['#c98f9c', '#f6d9dc']
    ];
    var PET_LEVELS = 3;

    /* Screened light is the obvious choice for motes and it is wrong
       here: this chapter's ground is a sky at L 170, and adding light
       to that adds nothing you can see. They are drawn normally
       instead, in tones that sit *beside* the sky rather than above
       it — warm rose, pale violet, cream — so they read as motes in
       the air rather than as nothing at all. */
    var MOTE_TONE = ['rgba(255,196,206,', 'rgba(206,206,255,', 'rgba(255,240,214,'];

    var flySprite = null, flySoft = null, petSprite = null, moteSprite = null, heartSprite = null;
    var dpr = 1, cw = 0, ch = 0, map = null;
    var flies = [], petals = [], fore = [], motes = [], heart = [], escort = [];
    var wingClock = 0;

    /* ---------- cover / band mapping (see petals.js) ---------- */
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

    /* ---------- depth ----------------------------------------
       The couple stand in a column of their own and a butterfly
       drawn at full strength across their faces is a sticker on the
       lens. Far-layer ones dim over that column instead, which is
       what reads as passing behind them. Mid and near do not, so the
       same frame has butterflies on both sides of the couple. */
    var AV = opts.avoid || { x0: 33, x1: 60, yTop: 25 };
    function behind(fx, fy) {
      if (fx < AV.x0 || fx > AV.x1 || fy < AV.yTop) return 1;
      var mid = (AV.x0 + AV.x1) * 0.5, half = (AV.x1 - AV.x0) * 0.5;
      var ex = 1 - Math.min(1, Math.abs(fx - mid) / half);
      var ey = fy < AV.yTop + 7 ? (fy - AV.yTop) / 7 : 1;
      return 1 - 0.74 * ex * ey;
    }

    /* The mid layer flies in front of them, which is right, but a
       butterfly parked at full strength across her face is not a
       depth cue, it is a blemish. Only the heads are protected, and
       only softly — they still cross, they just thin as they do. */
    var FACE = opts.face || { x0: 37, x1: 57, y0: 24, y1: 47 };
    function offFace(fx, fy) {
      if (fx < FACE.x0 || fx > FACE.x1 || fy < FACE.y0 || fy > FACE.y1) return 1;
      var mx = 1 - Math.abs(fx - (FACE.x0 + FACE.x1) * 0.5) / ((FACE.x1 - FACE.x0) * 0.5);
      var my = 1 - Math.abs(fy - (FACE.y0 + FACE.y1) * 0.5) / ((FACE.y1 - FACE.y0) * 0.5);
      return 1 - 0.60 * mx * my;
    }

    /* ---------- the pools ------------------------------------- */
    function flock(rnd, n, layer, blue, out) {
      for (var i = 0; i < n; i++) {
        var t = n < 2 ? 0.5 : i / (n - 1);
        /* Reds are back-loaded rather than spread flat, so the first
           fifth of the chapter has only a few of them in it and the
           swarm arrives as the chapter opens up. Blues start late by
           construction — that is the transformation, not a fade. */
        var birth = blue
          ? 0.400 + 0.520 * Math.pow(t, 0.92) + pick(rnd, -0.02, 0.02)
          : 0.020 + 0.760 * Math.pow(t, 1.28) + pick(rnd, -0.02, 0.02);

        /* Enter from an edge and leave by another. The straight term
           sets the crossing; the two sine terms bend it into a real
           flight path with a slow wander inside a broad curve. */
        var side = rnd();
        var x0, y0, ax, ay;
        if (side < 0.42) { x0 = pick(rnd, -14, -4); ax = pick(rnd, 60, 132); }
        else if (side < 0.84) { x0 = pick(rnd, 104, 116); ax = -pick(rnd, 60, 132); }
        else { x0 = pick(rnd, 8, 92); ax = pick(rnd, -40, 40); }
        y0 = pick(rnd, -8, 104);
        ay = pick(rnd, -46, 24);
        /* keep the drift generally upward — they rise out of frame */
        if (y0 > 62 && ay > -8) ay = -pick(rnd, 26, 62);

        var life = layer === 2 ? pick(rnd, 0.090, 0.190)
                 : layer === 1 ? pick(rnd, 0.150, 0.300)
                               : pick(rnd, 0.200, 0.420);

        out.push({
          blue: blue,
          fam: blue ? FIRST_BLUE + ((rnd() * 4) | 0) : ((rnd() * 4) | 0),
          layer: layer,
          birth: birth,
          life: life,
          x0: x0, y0: y0, ax: ax, ay: ay,
          bx: pick(rnd, 3, 13), by: pick(rnd, 3, 11),
          fx: pick(rnd, 0.6, 2.1), fy: pick(rnd, 0.7, 2.4),
          px: pick(rnd, 0, TAU), py: pick(rnd, 0, TAU),
          /* Roughly 3-6% of frame height far, 7-12% mid, 20-35% near.
             The first cut ran less than half this and the swarm read
             as midges — at that size the wing shape is not resolvable
             and a butterfly is only its silhouette. */
          sz: layer === 2 ? pick(rnd, 3.60, 6.40)
            : layer === 1 ? pick(rnd, 1.45, 2.45)
                          : pick(rnd, 0.62, 1.15),
          op: layer === 2 ? pick(rnd, 0.30, 0.52)
            : layer === 1 ? pick(rnd, 0.55, 0.88)
                          : pick(rnd, 0.28, 0.58),
          /* Wing rhythms are deliberately unrelated to each other —
             a synchronised swarm is the single clearest tell that
             something was generated rather than filmed. */
          beat: pick(rnd, 0.72, 1.55),
          bph: pick(rnd, 0, TAU),
          /* How far the wings shut. Scene 02 learned this the hard
             way and the note is in the README: a third of the span
             reads as a bowtie for most of a crossing, which is most of
             what anyone ever sees. It bottoms out near two thirds. */
          close: pick(rnd, 0.58, 0.80),
          wob: pick(rnd, 0.06, 0.30),
          wobf: pick(rnd, 0.8, 2.6),
          /* a few of the near ones come at the lens and swell */
          zoom: layer === 2 ? pick(rnd, 0.5, 1.5) : pick(rnd, -0.12, 0.30),
          trail: !REDUCED && layer !== 0 && rnd() < 0.16,
          /* Some reds do not merely fade at the end — they turn. The
             draw cross-fades the two sprites, so one creature changes
             colour rather than one vanishing and another arriving. */
          morph: (!blue && rnd() < 0.34) ? FIRST_BLUE + ((rnd() * 4) | 0) : -1
        });
      }
    }

    function build() {
      var rnd = util.rng(opts.seed || 7);
      var c = opts.counts;
      flies.length = 0; petals.length = 0; fore.length = 0; motes.length = 0;
      heart.length = 0; escort.length = 0;

      /* Reds fill the early and middle chapter, blues the later one.
         Far first so the array is roughly in depth order and the draw
         can walk it once per layer without sorting. */
      flock(rnd, Math.round(c.far * 0.60), 0, false, flies);
      flock(rnd, Math.round(c.far * 0.40), 0, true,  flies);
      flock(rnd, Math.round(c.mid * 0.58), 1, false, flies);
      flock(rnd, Math.round(c.mid * 0.42), 1, true,  flies);
      flock(rnd, Math.round(c.near * 0.55), 2, false, flies);
      flock(rnd, Math.round(c.near * 0.45), 2, true,  flies);

      /* --- petals that belong to a butterfly ---
         §12 asks for the two to read as one choreographed world rather
         than two effects sharing a frame. These ride a specific
         butterfly's own path a little way behind it, offset to one
         side and sinking as they go — so a butterfly crosses and a few
         petals follow it through, which is the thing the brief
         actually describes. They cost the same as any other petal:
         the parent's curve is evaluated at u minus a lag. */
      var carriers = [], ci;
      for (ci = 0; ci < flies.length; ci++) {
        if (flies[ci].layer === 1 && flies[ci].life > 0.20) carriers.push(ci);
      }
      var wanted = Math.min(carriers.length, opts.counts.escort || 0);
      for (ci = 0; ci < wanted; ci++) {
        var host = carriers[Math.floor(ci * carriers.length / wanted)];
        var tail = 3 + ((rnd() * 3) | 0);
        for (var e = 0; e < tail; e++) {
          escort.push({
            fly: host,
            lag: 0.035 + e * 0.045 + pick(rnd, 0, 0.02),
            off: pick(rnd, -3.2, 3.2),
            fall: pick(rnd, 6, 20),
            r0: pick(rnd, 0, TAU), spin: pick(rnd, -2.4, 2.4),
            tum: pick(rnd, 0, TAU), tsp: pick(rnd, 1.4, 4.2),
            sz: pick(rnd, 0.42, 0.92),
            ar: pick(rnd, 0.72, 1.26),
            tone: (rnd() * PET_TONE.length) | 0,
            dim: pick(rnd, 0.42, 0.86)
          });
        }
      }

      /* --- rose petals ---
         A background drift plus the beats. §11 asks for the effect to
         build and release rather than run flat, so most of the pool
         belongs to the beats and the drift underneath them is thin. */
      var beats = opts.petalBeats || [];
      var share = 0, i, j, b;
      for (i = 0; i < beats.length; i++) share += beats[i].n;

      for (i = 0; i < beats.length; i++) {
        b = beats[i];
        for (j = 0; j < b.n; j++) {
          var dep = rnd() * rnd();
          petals.push({
            birth: b.q + pick(rnd, 0, 0.030),
            life: pick(rnd, 0.16, 0.38),
            x0: pick(rnd, -6, 106), y0: pick(rnd, -22, 40),
            vx: pick(rnd, -22, 14) * b.power,
            vy: pick(rnd, 58, 132) * (0.7 + dep * 0.8),
            sway: pick(rnd, 2, 7), swf: pick(rnd, 0.9, 2.6), swp: pick(rnd, 0, TAU),
            r0: pick(rnd, 0, TAU), spin: pick(rnd, -2.6, 2.6),
            tum: pick(rnd, 0, TAU), tsp: pick(rnd, 1.5, 4.6),
            sz: 0.30 + dep * 1.45,
            ar: pick(rnd, 0.70, 1.30),
            tone: (rnd() * PET_TONE.length) | 0,
            dim: pick(rnd, 0.50, 1) * (1 - dep * 0.40)
          });
        }
      }
      var drift = Math.max(0, opts.counts.petal - share);
      for (i = 0; i < drift; i++) {
        var t2 = drift < 2 ? 0 : i / (drift - 1);
        var dp = rnd() * rnd();
        petals.push({
          birth: 0.180 + 0.680 * t2 + pick(rnd, -0.03, 0.03),
          life: pick(rnd, 0.20, 0.44),
          x0: pick(rnd, -6, 106), y0: pick(rnd, -20, -2),
          vx: pick(rnd, -20, 12), vy: pick(rnd, 62, 128) * (0.7 + dp * 0.8),
          sway: pick(rnd, 2, 8), swf: pick(rnd, 0.8, 2.4), swp: pick(rnd, 0, TAU),
          r0: pick(rnd, 0, TAU), spin: pick(rnd, -2.2, 2.2),
          tum: pick(rnd, 0, TAU), tsp: pick(rnd, 1.3, 4.0),
          sz: 0.26 + dp * 1.30,
          ar: pick(rnd, 0.70, 1.30),
          tone: (rnd() * PET_TONE.length) | 0,
          dim: pick(rnd, 0.42, 0.92) * (1 - dp * 0.44)
        });
      }

      /* foreground petals — few, large, soft, and late */
      for (i = 0; i < opts.counts.fore; i++) {
        fore.push({
          birth: 0.560 + 0.330 * (i / Math.max(1, opts.counts.fore - 1)) + pick(rnd, -0.04, 0.04),
          life: pick(rnd, 0.10, 0.20),
          x0: pick(rnd, -10, 110), y0: pick(rnd, -26, -6),
          vx: pick(rnd, -26, 18), vy: pick(rnd, 130, 210),
          sway: pick(rnd, 3, 9), swf: pick(rnd, 0.7, 1.8), swp: pick(rnd, 0, TAU),
          r0: pick(rnd, 0, TAU), spin: pick(rnd, -1.8, 1.8),
          tum: pick(rnd, 0, TAU), tsp: pick(rnd, 1.0, 2.6),
          sz: pick(rnd, 2.4, 4.6),
          ar: pick(rnd, 0.80, 1.25),
          tone: (rnd() * PET_TONE.length) | 0,
          dim: pick(rnd, 0.16, 0.34)
        });
      }

      /* light motes — the only bokeh in the chapter */
      for (i = 0; i < opts.counts.mote; i++) {
        motes.push({
          birth: 0.240 + 0.560 * (i / Math.max(1, opts.counts.mote - 1)) + pick(rnd, -0.05, 0.05),
          life: pick(rnd, 0.22, 0.50),
          x0: pick(rnd, -4, 104), y0: pick(rnd, 6, 100),
          vx: pick(rnd, -14, 14), vy: -pick(rnd, 14, 52),
          sway: pick(rnd, 1, 5), swf: pick(rnd, 0.6, 1.9), swp: pick(rnd, 0, TAU),
          sz: pick(rnd, 0.26, 1.05),
          op: pick(rnd, 0.26, 0.70),
          tone: (rnd() * MOTE_TONE.length) | 0
        });
      }

      /* --- the hidden thing ---
         §18 asked for love symbolism that is discovered rather than
         announced. It is fourteen motes that drift into the shape of
         a heart, hold for a moment in clean sky well off centre, and
         leave. At this alpha most people will never consciously see
         it; the ones who do will not be told. */
      var H = opts.heart;
      if (H && !REDUCED) {
        for (i = 0; i < H.n; i++) {
          var a = (i / H.n) * TAU;
          var hx = 16 * Math.pow(Math.sin(a), 3);
          var hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
          heart.push({
            x: H.x + hx * H.r * 0.062,
            y: H.y + hy * H.r * 0.062,
            fx: H.x + hx * H.r * 0.062 + pick(rnd, -14, 14),
            fy: H.y + hy * H.r * 0.062 + pick(rnd, -12, 12),
            d: pick(rnd, 0, 0.30),
            sz: pick(rnd, 0.46, 0.80),
            op: pick(rnd, 0.62, 1)
          });
        }
      }
    }

    /* ---------- sizing ---------------------------------------- */
    function bakeAll() {
      var i, j;
      flySprite = []; flySoft = [];
      for (i = 0; i < FLY_TONE.length; i++) {
        flySprite.push(bakeFly(FLY_TONE[i][0], FLY_TONE[i][1], FLY_TONE[i][2], false, S_FLY, dpr));
        flySoft.push(bakeFly(FLY_TONE[i][0], FLY_TONE[i][1], FLY_TONE[i][2], true, S_FLY, dpr));
      }
      petSprite = [];
      for (i = 0; i < PET_TONE.length; i++) {
        var row = [];
        for (j = 0; j < PET_LEVELS; j++) {
          row.push(bakePetal(PET_TONE[i][0], PET_TONE[i][1], j / (PET_LEVELS - 1), S_PET, dpr));
        }
        petSprite.push(row);
      }
      moteSprite = [];
      for (i = 0; i < MOTE_TONE.length; i++) moteSprite.push(bakeMote(MOTE_TONE[i], S_MOTE, dpr));
      /* Its own tone, and deliberately *darker* than the sky rather
         than brighter. A pale point on an L 170 ground is invisible
         however carefully it is placed; a soft rose one at L 150 is
         faint but findable, which is the whole idea. */
      heartSprite = bakeMote('rgba(226,104,126,', S_MOTE, dpr);
    }

    function sizeOne(cv) {
      if (!cv) return;
      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
    }

    function resize() {
      var r = backC.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width));
      var h = Math.max(1, Math.round(r.height));
      var d = Math.min(window.devicePixelRatio || 1, 2);
      if (w === cw && h === ch && d === dpr && flySprite) return;
      cw = w; ch = h;
      if (d !== dpr || !flySprite) { dpr = d; bakeAll(); }
      sizeOne(backC); sizeOne(frontC);
      remap();
    }

    /* ---------- shared particle helpers ----------------------- */

    function drawPetal(ctx, p, u, alpha, lit) {
      var fx = p.x0 + p.vx * u + p.sway * Math.sin(p.swf * u * TAU + p.swp);
      var fy = p.y0 + p.vy * u;
      if (fy < -30 || fy > 132 || fx < -20 || fx > 120) return;
      /* Sized against the picture, not against the device. Without the
         map factor a petal is a fixed number of pixels — four percent
         of a desktop frame and eighteen of a phone's, which on the
         portrait plate (whose picture is a band a quarter of the
         screen tall) put petals the size of her head across her face.
         The butterflies were already scaled this way. */
      var s = p.sz * S_PET * map.s * 0.11;
      var tw = (0.26 + 0.74 * Math.abs(Math.cos(p.tum + p.tsp * u * TAU))) * p.ar;
      var rot = p.r0 + p.spin * u;
      var co = Math.cos(rot), si = Math.sin(rot);
      var lv = (lit * (PET_LEVELS - 1) + 0.5) | 0;
      if (lv > PET_LEVELS - 1) lv = PET_LEVELS - 1;
      ctx.globalAlpha = alpha;
      ctx.setTransform(dpr * co * tw, dpr * si * tw, dpr * -si, dpr * co,
                       dpr * map.x(fx), dpr * map.y(fy));
      ctx.drawImage(petSprite[p.tone][lv], -s * 0.5, -s * 0.5, s, s);
    }

    /* A butterfly's heading is the tangent of its own path, so it
       always points where it is actually going — including through
       the turns, which is where a fixed rotation gives itself away. */
    function flyAt(f, u, out) {
      var a1 = f.fx * u * TAU + f.px, a2 = f.fy * u * TAU + f.py;
      out.x = f.x0 + f.ax * u + f.bx * Math.sin(a1);
      out.y = f.y0 + f.ay * u + f.by * Math.sin(a2);
      out.dx = f.ax + f.bx * f.fx * TAU * Math.cos(a1);
      out.dy = f.ay + f.by * f.fy * TAU * Math.cos(a2);
    }

    var P = { x: 0, y: 0, dx: 0, dy: 0 }, P2 = { x: 0, y: 0, dx: 0, dy: 0 };

    function drawFly(ctx, f, u, lv, soft) {
      flyAt(f, u, P);
      if (P.y < -26 || P.y > 128 || P.x < -22 || P.x > 122) return;

      var famAlpha = f.blue ? lv.blue : lv.red;
      if (famAlpha < 0.004) return;

      /* fade in and out of its own flight rather than popping */
      var edge = u < 0.13 ? u / 0.13 : u > 0.80 ? (1 - u) / 0.20 : 1;
      var a = f.op * edge * famAlpha * lv.all;
      if (f.layer === 0) a *= behind(P.x, P.y);
      else if (f.layer === 1) a *= offFace(P.x, P.y);

      /* the ones that come at the lens swell and thin as they pass */
      var grow = 1 + f.zoom * u;
      if (f.zoom > 0.6) a *= (1 - 0.45 * u);
      if (a < 0.004) return;

      var s = f.sz * S_FLY * grow * (map.s * 0.11);
      if (s < 1.5) return;

      /* wingbeat: scroll drives it, and a slow clock keeps it alive
         when the film is held. It changes width only — a butterfly
         seen from above loses span as the wings close, and never all
         of it, or the frame reads as dropped. */
      var beat = f.bph + f.beat * (u * 9.0 + wingClock * 1.7);
      /* squared, so it sits open and snaps through the closed part —
         which is what a real wingbeat looks like */
      var sb = Math.sin(beat);
      var span = 1 - (1 - f.close) * sb * sb;
      var rot = Math.atan2(P.dy, P.dx) + Math.PI / 2 +
                f.wob * Math.sin(f.wobf * u * TAU + f.bph);

      var co = Math.cos(rot), si = Math.sin(rot);
      var px = map.x(P.x), py = map.y(P.y);
      var set = soft ? flySoft : flySprite;

      /* the trail: the same path a few steps back, thinning */
      if (f.trail && lv.all > 0.2) {
        for (var t = 1; t <= 4; t++) {
          var tu = u - t * 0.016;
          if (tu <= 0) break;
          flyAt(f, tu, P2);
          ctx.globalAlpha = a * 0.16 * (1 - t / 5);
          var ts = s * (1 - t * 0.07);
          ctx.setTransform(dpr * co * span, dpr * si * span, dpr * -si, dpr * co,
                           dpr * map.x(P2.x), dpr * map.y(P2.y));
          ctx.drawImage(set[f.fam], -ts * 0.5, -ts * 0.5, ts, ts);
        }
      }

      ctx.setTransform(dpr * co * span, dpr * si * span, dpr * -si, dpr * co, dpr * px, dpr * py);

      /* the turn. One creature changing colour, not one leaving and
         another arriving — so the two sprites cross-fade in place. */
      if (f.morph >= 0 && lv.morph > 0) {
        ctx.globalAlpha = a * (1 - lv.morph);
        ctx.drawImage(set[f.fam], -s * 0.5, -s * 0.5, s, s);
        ctx.globalAlpha = a * lv.morph;
        ctx.drawImage(set[f.morph], -s * 0.5, -s * 0.5, s, s);
      } else {
        ctx.globalAlpha = a;
        ctx.drawImage(set[f.fam], -s * 0.5, -s * 0.5, s, s);
      }
    }

    /* ---------- draw ------------------------------------------ */
    var blank = false;

    function draw(q, clock) {
      if (!map) return;
      wingClock = clock;

      var lv = opts.levels(q);
      var i, p, u;

      if (lv.all <= 0.002) {
        if (!blank) {
          bx2.setTransform(1, 0, 0, 1, 0, 0);
          bx2.clearRect(0, 0, backC.width, backC.height);
          if (fx2) { fx2.setTransform(1, 0, 0, 1, 0, 0); fx2.clearRect(0, 0, frontC.width, frontC.height); }
          blank = true;
        }
        return;
      }
      blank = false;

      bx2.setTransform(1, 0, 0, 1, 0, 0);
      bx2.clearRect(0, 0, backC.width, backC.height);
      if (fx2) { fx2.setTransform(1, 0, 0, 1, 0, 0); fx2.clearRect(0, 0, frontC.width, frontC.height); }

      /* --- motes, behind everything --- */
      if (lv.mote > 0.004) {
        for (i = 0; i < motes.length; i++) {
          p = motes[i];
          u = (q - p.birth) / p.life;
          if (u <= 0 || u >= 1) continue;
          var mx = p.x0 + p.vx * u + p.sway * Math.sin(p.swf * u * TAU + p.swp);
          var my = p.y0 + p.vy * u;
          if (my < -12 || my > 112) continue;
          var ma = p.op * lv.mote * Math.sin(u * Math.PI) * 0.62;
          if (ma < 0.005) continue;
          var ms = p.sz * S_MOTE * map.s * 0.11;
          bx2.globalAlpha = ma;
          bx2.setTransform(dpr, 0, 0, dpr, 0, 0);
          bx2.drawImage(moteSprite[p.tone], map.x(mx) - ms * 0.5, map.y(my) - ms * 0.5, ms, ms);
        }

        /* the heart, if this is its moment */
        if (heart.length && opts.heart) {
          var H = opts.heart;
          var hu = (q - H.q) / H.life;
          if (hu > 0 && hu < 1) {
            /* out of the scatter, held, and back into it */
            var form = hu < 0.42 ? util.ease(hu / 0.42) : hu > 0.68 ? 1 - util.ease((hu - 0.68) / 0.32) : 1;
            var show = Math.sin(hu * Math.PI);
            bx2.setTransform(dpr, 0, 0, dpr, 0, 0);
            for (i = 0; i < heart.length; i++) {
              var h = heart[i];
              var g2 = clamp01((form - h.d) / (1 - h.d));
              var hx = h.fx + (h.x - h.fx) * g2;
              var hy = h.fy + (h.y - h.fy) * g2;
              var hs = h.sz * S_MOTE * map.s * 0.11;
              bx2.globalAlpha = h.op * show * lv.mote * 0.50;
              bx2.drawImage(heartSprite, map.x(hx) - hs * 0.5, map.y(hy) - hs * 0.5, hs, hs);
            }
          }
        }
      }

      /* --- far butterflies --- */
      for (i = 0; i < flies.length; i++) {
        p = flies[i];
        if (p.layer !== 0) continue;
        u = (q - p.birth) / p.life;
        if (u > 0 && u < 1) drawFly(bx2, p, u, lv, false);
      }

      /* --- rose petals --- */
      if (lv.petal > 0.004) {
        for (i = 0; i < petals.length; i++) {
          p = petals[i];
          u = (q - p.birth) / p.life;
          if (u <= 0 || u >= 1) continue;
          var pfy = p.y0 + p.vy * u;
          /* low in the frame is the crowd's warm bounce, high in it
             is sky light — which level a petal picks is what
             "catching the light" means in this chapter */
          var lit = clamp01(1 - (pfy - 10) / 80) * 0.55 + lv.petal * 0.45;
          var pe = u < 0.10 ? u / 0.10 : u > 0.76 ? (1 - u) / 0.24 : 1;
          var pa = pe * p.dim * lv.petal;
          if (pa > 0.004) drawPetal(bx2, p, u, pa > 1 ? 1 : pa, lit);
        }
      }

      /* --- the petals a butterfly is carrying --- */
      if (lv.petal > 0.004) {
        for (i = 0; i < escort.length; i++) {
          p = escort[i];
          var host = flies[p.fly];
          var hu = (q - host.birth) / host.life;
          if (hu <= 0 || hu >= 1) continue;
          var eu = hu - p.lag;
          if (eu <= 0) continue;
          flyAt(host, eu, P);
          /* one perpendicular step off the flight line, and sinking */
          var len = Math.sqrt(P.dx * P.dx + P.dy * P.dy) || 1;
          var ex = P.x + (-P.dy / len) * p.off;
          var ey = P.y + (P.dx / len) * p.off + p.fall * hu;
          if (ey < -30 || ey > 132 || ex < -20 || ex > 120) continue;
          var ea = (hu < 0.18 ? hu / 0.18 : hu > 0.78 ? (1 - hu) / 0.22 : 1) *
                   p.dim * lv.petal * ((host.blue ? lv.blue : lv.red) * 0.5 + 0.5);
          if (ea < 0.004) continue;
          var es = p.sz * S_PET * map.s * 0.11;
          var etw = (0.26 + 0.74 * Math.abs(Math.cos(p.tum + p.tsp * hu * TAU))) * p.ar;
          var erot = p.r0 + p.spin * hu;
          var eco = Math.cos(erot), esi = Math.sin(erot);
          bx2.globalAlpha = ea > 1 ? 1 : ea;
          bx2.setTransform(dpr * eco * etw, dpr * esi * etw, dpr * -esi, dpr * eco,
                           dpr * map.x(ex), dpr * map.y(ey));
          bx2.drawImage(petSprite[p.tone][1], -es * 0.5, -es * 0.5, es, es);
        }
        bx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      /* --- mid butterflies, over the petals --- */
      for (i = 0; i < flies.length; i++) {
        p = flies[i];
        if (p.layer !== 1) continue;
        u = (q - p.birth) / p.life;
        if (u > 0 && u < 1) drawFly(bx2, p, u, lv, false);
      }

      bx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      bx2.globalAlpha = 1;

      /* --- the foreground, above the typography --- */
      if (fx2) {
        for (i = 0; i < fore.length; i++) {
          p = fore[i];
          u = (q - p.birth) / p.life;
          if (u <= 0 || u >= 1) continue;
          var fe = u < 0.18 ? u / 0.18 : u > 0.70 ? (1 - u) / 0.30 : 1;
          var fa = fe * p.dim * lv.petal;
          if (fa > 0.004) drawPetal(fx2, p, u, fa, 0.7);
        }
        for (i = 0; i < flies.length; i++) {
          p = flies[i];
          if (p.layer !== 2) continue;
          u = (q - p.birth) / p.life;
          if (u > 0 && u < 1) drawFly(fx2, p, u, lv, true);
        }
        fx2.setTransform(dpr, 0, 0, dpr, 0, 0);
        fx2.globalAlpha = 1;
      }
    }

    build();
    resize();

    /* Counting what is actually on screen, rather than reasoning about
       what ought to be. Used to tune the density; it allocates, so it
       is never called from the draw path. */
    function stats(q) {
      var lv = opts.levels(q), o = { red: 0, blue: 0, far: 0, mid: 0, near: 0, petal: 0, fore: 0, mote: 0 };
      var i, p, u;
      for (i = 0; i < flies.length; i++) {
        p = flies[i]; u = (q - p.birth) / p.life;
        if (u <= 0 || u >= 1) continue;
        flyAt(p, u, P);
        if (P.y < -26 || P.y > 128 || P.x < -22 || P.x > 122) continue;
        if ((p.blue ? lv.blue : lv.red) * lv.all < 0.02) continue;
        if (p.blue) o.blue++; else o.red++;
        if (p.layer === 0) o.far++; else if (p.layer === 1) o.mid++; else o.near++;
      }
      for (i = 0; i < petals.length; i++) {
        u = (q - petals[i].birth) / petals[i].life;
        if (u > 0 && u < 1 && lv.petal > 0.02) o.petal++;
      }
      for (i = 0; i < fore.length; i++) {
        u = (q - fore[i].birth) / fore[i].life;
        if (u > 0 && u < 1 && lv.petal > 0.02) o.fore++;
      }
      for (i = 0; i < motes.length; i++) {
        u = (q - motes[i].birth) / motes[i].life;
        if (u > 0 && u < 1 && lv.mote > 0.02) o.mote++;
      }
      return o;
    }

    return {
      draw: draw,
      resize: resize,
      stats: stats,
      rebuild: function () { build(); resize(); }
    };
  };
})();
