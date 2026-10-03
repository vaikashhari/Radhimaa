/* ============================================================
   RADHIMAA — the night's lights

   Scene 05's air: tiny lights that wake up inside a dark frame.
   Three depth layers, a handful of named first lights that arrive one
   at a time, and a birth envelope that makes each one pop rather than
   fade in.

   Same rule as the two chapters before it — **position is a pure
   function of q**. Every drift is a closed-form curve evaluated at
   `u = (q − birth) / life`, so scrolling back un-lights the night
   through exactly the frames it came through.

   The exception, again, is the part that has to breathe: pulse and
   flicker carry a slow clock term as well as a scroll term, because a
   light held perfectly still is a dot and a light that trembles is a
   light. It moves nothing by a pixel, and it is switched off entirely
   under `prefers-reduced-motion`.

   **Additive is right here and it was wrong in Scene 04.** That
   chapter's ground is a sky at L 170, where screened light adds
   nothing you can see. This one is a night at L 36. Every light in
   here is drawn with `lighter`, which is what makes them read as
   sources rather than as pale stickers — and what makes two of them
   overlapping brighter than either, the way light actually behaves.
   ============================================================ */
(function () {
  'use strict';

  var R = window.Radhimaa;
  if (!R) return;

  var util = R.util;
  var clamp01 = util.clamp01, pick = util.pick, ease = util.ease;
  var TAU = Math.PI * 2;

  /* ------------------------------------------------------------
     Three profiles, because a distant light and an out-of-focus one
     are not the same object drawn at different sizes.

       0  point — a hard bright core with a small halo. Far layer.
       1  glow  — a soft even falloff. The fireflies.
       2  disc  — a flat disc with a brighter rim, which is what a
                  real out-of-focus highlight looks like. Foreground.
     ------------------------------------------------------------ */
  function bakeLight(rgb, profile, S, dpr) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = S * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);

    var h = S / 2;
    var g = c.createRadialGradient(h, h, 0, h, h, h);

    if (profile === 0) {
      g.addColorStop(0.00, rgb + '1)');
      g.addColorStop(0.05, rgb + '.92)');
      g.addColorStop(0.14, rgb + '.34)');
      g.addColorStop(0.34, rgb + '.09)');
      g.addColorStop(1.00, rgb + '0)');
    } else if (profile === 1) {
      g.addColorStop(0.00, rgb + '.96)');
      g.addColorStop(0.10, rgb + '.72)');
      g.addColorStop(0.28, rgb + '.30)');
      g.addColorStop(0.56, rgb + '.08)');
      g.addColorStop(1.00, rgb + '0)');
    } else {
      /* the rim is the whole point of a bokeh disc */
      g.addColorStop(0.00, rgb + '.34)');
      g.addColorStop(0.52, rgb + '.38)');
      g.addColorStop(0.74, rgb + '.52)');
      g.addColorStop(0.86, rgb + '.30)');
      g.addColorStop(0.96, rgb + '.05)');
      g.addColorStop(1.00, rgb + '0)');
    }
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    return cv;
  }

  /* ------------------------------------------------------------
     THE BIRTH — §14 asks for pop, then glow, then settle.

     Returns brightness and a size multiplier for the first sixth of a
     light's life. A tiny intensely bright point arrives, opens
     quickly into a glow, and settles a little smaller and calmer than
     its peak. Nothing bounces: the overshoot is in the brightness and
     the radius, not in the position.
     ------------------------------------------------------------ */
  var POP = { b: 0, s: 0 };
  function popAt(u) {
    if (u < 0.028) {                       /* the point strikes */
      var a = u / 0.028;
      POP.b = a * a;
      POP.s = 0.16 + a * 0.20;
    } else if (u < 0.095) {                /* it opens */
      var b = (u - 0.028) / 0.067;
      POP.b = 1;
      POP.s = 0.36 + ease(b) * 0.92;
    } else if (u < 0.175) {                /* and settles back */
      var c = (u - 0.095) / 0.080;
      POP.b = 1 - ease(c) * 0.22;
      POP.s = 1.28 - ease(c) * 0.30;
    } else {
      POP.b = 0.78;
      POP.s = 0.98;
    }
    return POP;
  }

  /* ------------------------------------------------------------
     R.lumen(opts)

       back, front   the two canvases the type sits between
       plate         { w, h, ox, oy } for the cover mapping
       band          { top, height } for a portrait plate
       seed          deterministic
       counts        { far, mid, near, spark }
       first         [{ q, x, y, sz, tone }]  the named first lights
       levels(q)     { all, far, mid, near, spark, warm }
       avoid         { x0, x1, y0, y1 }  their faces
     ------------------------------------------------------------ */
  R.lumen = function (opts) {
    var backC = opts.back, frontC = opts.front;
    if (!backC || !backC.getContext) return null;

    var bx2 = backC.getContext('2d');
    var fx2 = frontC ? frontC.getContext('2d') : null;
    if (!bx2) return null;

    var REDUCED = R.reduced;
    var S_LITE = 64;

    /* §13 — gold, warm white, soft lavender, pale blue. The plate's
       own bokeh is blue-white with warm amber in it, so these extend
       what is already burning rather than introducing a new palette. */
    var TONE = [
      'rgba(255,198,108,',   /* gold */
      'rgba(255,238,214,',   /* warm white */
      'rgba(206,186,255,',   /* lavender */
      'rgba(176,214,255,'    /* pale blue */
    ];

    var sprite = null, dpr = 1;
    var cw = 0, ch = 0, map = null;
    var lights = [], sparks = [], clock = 0;
    var blank = false;
    var BAND = !!opts.band;

    /* ---------- cover / band mapping ---------- */
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

    /* Their faces. A light is welcome anywhere in this frame except
       sitting on someone's eye — the couple are the subject and the
       lights are the weather. Softly, so they still drift across. */
    var AV = opts.avoid || { x0: 22, x1: 50, y0: 20, y1: 42 };
    function offFace(fx, fy) {
      if (fx < AV.x0 || fx > AV.x1 || fy < AV.y0 || fy > AV.y1) return 1;
      var mx = 1 - Math.abs(fx - (AV.x0 + AV.x1) * 0.5) / ((AV.x1 - AV.x0) * 0.5);
      var my = 1 - Math.abs(fy - (AV.y0 + AV.y1) * 0.5) / ((AV.y1 - AV.y0) * 0.5);
      return 1 - 0.66 * mx * my;
    }

    /* ---------- the pool ---------- */
    function one(rnd, layer, birth, life, o) {
      var L = {
        layer: layer,
        birth: birth,
        life: life,
        x0: o && o.x != null ? o.x : pick(rnd, -4, 104),
        y0: o && o.y != null ? o.y : pick(rnd, -4, 106),
        /* Fireflies wander; distant lights barely move; foreground
           ones drift a little and swell as they pass the lens. */
        ax: layer === 1 ? pick(rnd, -13, 13) : layer === 2 ? pick(rnd, -9, 9) : pick(rnd, -3, 3),
        ay: layer === 1 ? pick(rnd, -18, 6) : layer === 2 ? pick(rnd, -12, 5) : pick(rnd, -4, 2),
        bx: layer === 1 ? pick(rnd, 2, 8) : pick(rnd, 0.4, 2.4),
        by: layer === 1 ? pick(rnd, 2, 7) : pick(rnd, 0.4, 2.0),
        fx: pick(rnd, 0.5, 2.2),
        fy: pick(rnd, 0.6, 2.6),
        px: pick(rnd, 0, TAU),
        py: pick(rnd, 0, TAU),
        sz: o && o.sz != null ? o.sz
          : layer === 2 ? pick(rnd, 2.6, 5.4)
          : layer === 1 ? pick(rnd, 0.55, 1.30)
                        : pick(rnd, 0.28, 0.74),
        op: layer === 2 ? pick(rnd, 0.16, 0.34)
          : layer === 1 ? pick(rnd, 0.52, 1.00)
                        : pick(rnd, 0.34, 0.86),
        prof: layer === 2 ? 2 : layer === 1 ? 1 : 0,
        tone: o && o.tone != null ? o.tone : (rnd() * TONE.length) | 0,
        /* every light breathes at its own rate, and a few also carry
           a faster tremble — a night where they all pulse together is
           a string of fairy lights, not a night */
        pf: pick(rnd, 0.35, 1.25),
        pp: pick(rnd, 0, TAU),
        pa: layer === 1 ? pick(rnd, 0.18, 0.44) : pick(rnd, 0.10, 0.30),
        ff: pick(rnd, 5, 14),
        fa: rnd() < 0.34 ? pick(rnd, 0.05, 0.16) : 0,
        /* a few of the foreground ones come toward the lens */
        zoom: layer === 2 ? pick(rnd, 0.2, 1.0) : pick(rnd, -0.05, 0.18)
      };
      return L;
    }

    function build() {
      var rnd = util.rng(opts.seed || 5);
      var c = opts.counts;
      lights.length = 0; sparks.length = 0;
      var i, t;

      /* --- §04: one light, then another, then more ---
         The first few are placed by hand in measured dark ground and
         spaced far enough apart in q that each one is its own event.
         Everything after them is a distribution. */
      var first = opts.first || [];
      for (i = 0; i < first.length; i++) {
        var f = first[i];
        var L0 = one(rnd, 1, f.q, pick(rnd, 0.34, 0.50),
                     { x: f.x, y: f.y, sz: f.sz, tone: f.tone });
        /* These five are the chapter's opening statement, so they are
           not left to the pool's random brightness: each is near full
           opacity, breathes a little harder than the rest, and drifts
           barely at all. A first light that has to be looked for is
           not a first light. */
        L0.op = 0.96;
        L0.pa = 0.30;
        L0.ax *= 0.45; L0.ay *= 0.45;
        lights.push(L0);
      }

      /* --- the rest, strongly back-loaded ---
         The pool does not begin until the named five have all had the
         frame to themselves. An earlier cut started the far layer at
         0.250, which put a dozen lights on screen between the first
         hand-placed one and the second and turned five arrivals into
         a fade-in. Counted: 1 light at q 0.25 and 17 at 0.28.

         pow(t, 1.45) keeps it sparse where it starts and lets the
         count climb toward the swirl, which is where the plate's own
         light is going anyway. */
      for (i = 0; i < c.far; i++) {
        t = c.far < 2 ? 0 : i / (c.far - 1);
        lights.push(one(rnd, 0,
          0.348 + 0.500 * Math.pow(t, 1.45) + pick(rnd, -0.02, 0.02),
          pick(rnd, 0.24, 0.52)));
      }
      for (i = 0; i < c.mid; i++) {
        t = c.mid < 2 ? 0 : i / (c.mid - 1);
        lights.push(one(rnd, 1,
          0.358 + 0.480 * Math.pow(t, 1.35) + pick(rnd, -0.02, 0.02),
          pick(rnd, 0.20, 0.44)));
      }
      for (i = 0; i < c.near; i++) {
        t = c.near < 2 ? 0 : i / (c.near - 1);
        lights.push(one(rnd, 2,
          0.400 + 0.430 * Math.pow(t, 1.2) + pick(rnd, -0.03, 0.03),
          pick(rnd, 0.14, 0.30)));
      }

      /* --- sparks ---
         Very small, very brief, and never more than a few at once. A
         spark is a light that arrives, is bright for a moment and is
         gone — which is the difference between a night that glitters
         and one that twinkles. */
      for (i = 0; i < (REDUCED ? 0 : c.spark); i++) {
        t = c.spark < 2 ? 0 : i / (c.spark - 1);
        sparks.push({
          birth: 0.372 + 0.490 * t + pick(rnd, -0.025, 0.025),
          life: pick(rnd, 0.030, 0.075),
          x: pick(rnd, -2, 102),
          y: pick(rnd, -2, 102),
          sz: pick(rnd, 0.16, 0.40),
          op: pick(rnd, 0.45, 1),
          tone: (rnd() * TONE.length) | 0
        });
      }
    }

    /* ---------- sizing ---------- */
    function bakeAll() {
      sprite = [];
      for (var t = 0; t < TONE.length; t++) {
        var row = [];
        for (var p = 0; p < 3; p++) row.push(bakeLight(TONE[t], p, S_LITE, dpr));
        sprite.push(row);
      }
    }

    function resize() {
      var r = backC.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width));
      var h = Math.max(1, Math.round(r.height));
      var d = Math.min(window.devicePixelRatio || 1, 2);
      if (w === cw && h === ch && d === dpr && sprite) return;
      cw = w; ch = h;
      if (d !== dpr || !sprite) { dpr = d; bakeAll(); }
      backC.width = Math.round(cw * dpr);
      backC.height = Math.round(ch * dpr);
      if (frontC) { frontC.width = backC.width; frontC.height = backC.height; }
      remap();
      blank = false;
    }

    /* ---------- draw ---------- */
    var P = { x: 0, y: 0 };

    function place(L, u) {
      var a1 = L.fx * u * TAU + L.px, a2 = L.fy * u * TAU + L.py;
      P.x = L.x0 + L.ax * u + L.bx * Math.sin(a1);
      P.y = L.y0 + L.ay * u + L.by * Math.sin(a2);
    }

    function drawOne(ctx, L, u, lv) {
      place(L, u);
      if (P.y < -14 || P.y > 114 || P.x < -14 || P.x > 114) return;

      var lay = L.layer === 0 ? lv.far : L.layer === 1 ? lv.mid : lv.near;
      if (lay < 0.004) return;

      var pop = popAt(u);
      var out = u > 0.80 ? (1 - u) / 0.20 : 1;

      /* the breath, and for some of them a tremble under it */
      var br = 1 - L.pa * (0.5 - 0.5 * Math.cos(L.pf * (u * 7 + clock) * TAU));
      if (L.fa) br *= 1 - L.fa * (0.5 + 0.5 * Math.sin(L.ff * (u * 3 + clock) * TAU + L.pp));

      var a = L.op * pop.b * out * br * lay * lv.all;
      if (L.layer !== 2) a *= offFace(P.x, P.y);
      /* A portrait plate is a band of picture inside its own blurred
         fill. A light drifting on across the blur reads as a light in
         front of the screen rather than one in the night with them,
         so they fade out at the seam — which the plate's own seam is
         feathered to match. */
      if (BAND) {
        a *= P.y < 6 ? (P.y + 6) * 0.0833 : P.y > 94 ? (106 - P.y) * 0.0833 : 1;
      }
      if (a < 0.004) return;

      var s = L.sz * S_LITE * pop.s * (1 + L.zoom * u) * (map.s * 0.11);
      if (s < 0.8) return;

      ctx.globalAlpha = a > 1 ? 1 : a;
      ctx.drawImage(sprite[L.tone][L.prof],
                    map.x(P.x) - s * 0.5, map.y(P.y) - s * 0.5, s, s);
    }

    function draw(q, t) {
      if (!map) return;
      clock = t;

      var lv = opts.levels(q);
      var i, L, u;

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

      bx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      bx2.clearRect(0, 0, cw, ch);
      bx2.globalCompositeOperation = 'lighter';

      if (fx2) {
        fx2.setTransform(dpr, 0, 0, dpr, 0, 0);
        fx2.clearRect(0, 0, cw, ch);
        fx2.globalCompositeOperation = 'lighter';
      }

      /* far and mid draw behind the words, foreground in front */
      for (i = 0; i < lights.length; i++) {
        L = lights[i];
        u = (q - L.birth) / L.life;
        if (u <= 0 || u >= 1) continue;
        drawOne(L.layer === 2 && fx2 ? fx2 : bx2, L, u, lv);
      }

      /* --- sparks --- */
      if (lv.spark > 0.004) {
        for (i = 0; i < sparks.length; i++) {
          L = sparks[i];
          u = (q - L.birth) / L.life;
          if (u <= 0 || u >= 1) continue;
          /* in and out inside one short life — no settle */
          var sa = L.op * Math.sin(u * Math.PI) * lv.spark * lv.all;
          if (BAND) sa *= L.y < 6 ? (L.y + 6) * 0.0833 : L.y > 94 ? (106 - L.y) * 0.0833 : 1;
          if (sa < 0.006) continue;
          var ss = L.sz * S_LITE * (0.4 + Math.sin(u * Math.PI) * 0.8) * (map.s * 0.11);
          bx2.globalAlpha = sa > 1 ? 1 : sa;
          bx2.drawImage(sprite[L.tone][0],
                        map.x(L.x) - ss * 0.5, map.y(L.y) - ss * 0.5, ss, ss);
        }
      }

      bx2.globalCompositeOperation = 'source-over';
      bx2.globalAlpha = 1;
      if (fx2) { fx2.globalCompositeOperation = 'source-over'; fx2.globalAlpha = 1; }
    }

    /* Counted rather than assumed — this is how the density was
       tuned. It allocates, so it never runs from the draw path. */
    function stats(q) {
      var lv = opts.levels(q), o = { far: 0, mid: 0, near: 0, spark: 0 };
      var i, L, u;
      for (i = 0; i < lights.length; i++) {
        L = lights[i]; u = (q - L.birth) / L.life;
        if (u <= 0 || u >= 1) continue;
        place(L, u);
        if (P.y < -14 || P.y > 114 || P.x < -14 || P.x > 114) continue;
        var lay = L.layer === 0 ? lv.far : L.layer === 1 ? lv.mid : lv.near;
        if (lay * lv.all < 0.02) continue;
        if (L.layer === 0) o.far++; else if (L.layer === 1) o.mid++; else o.near++;
      }
      for (i = 0; i < sparks.length; i++) {
        u = (q - sparks[i].birth) / sparks[i].life;
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
