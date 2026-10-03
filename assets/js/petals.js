/* ============================================================
   RADHIMAA — the petal field

   A canvas particle field for the cinematic chapters. Two rules
   shape the whole design:

   **It is a pure function of q.** Nothing here integrates, and
   nothing here reads a clock. Every particle owns a birth point and
   a lifespan measured in scroll progress, and its position is the
   value of a closed-form curve at `u = (q - birth) / life`. Scroll
   forward and it falls; scroll backward and it un-falls through
   exactly the frames it came through; stop and it stops, on the same
   frame the plate stopped on. A velocity-integrating system cannot
   do that — reversing it would need the history it just threw away.

   **It is one node.** The brief asks for hundreds of petals, and
   hundreds of elements would be hundreds of style recalcs and
   composited layers. This is a single canvas with a pool allocated
   once at build time. Drawing is `drawImage` from pre-baked sprites,
   which costs a blit each and no allocation at all — nothing here
   makes garbage on a scroll.

   The sprites carry the light. Rather than tint at draw time, which
   canvas cannot do cheaply, each tone is baked at four brightness
   levels and a particle picks the level its position in the shaft
   earns it. One `drawImage` per particle, and petals still brighten
   as they cross the beam.
   ============================================================ */
(function () {
  'use strict';

  var R = window.Radhimaa;
  if (!R) return;

  var util = R.util;
  var clamp01 = util.clamp01, pick = util.pick;

  var TAU = Math.PI * 2;

  /* ------------------------------------------------------------
     Sprite baking

     Softness comes from the shadow, not from `ctx.filter`: the shape
     is drawn far enough off the tile that only its blurred shadow
     lands inside. That is supported everywhere, where `filter` on a
     2D context still is not.
     ------------------------------------------------------------ */

  function hex(c) {
    return [parseInt(c.slice(1, 3), 16),
            parseInt(c.slice(3, 5), 16),
            parseInt(c.slice(5, 7), 16)];
  }

  function mix(a, b, t) {
    var x = hex(a), y = hex(b);
    return 'rgba(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' +
                     Math.round(x[1] + (y[1] - x[1]) * t) + ',' +
                     Math.round(x[2] + (y[2] - x[2]) * t) + ',';
  }

  /* A petal, not a disc: a lens with one shoulder fuller than the
     other, so a tumbling one reads as a turning object rather than a
     pulsing dot. */
  function petalPath(c, w, h) {
    c.beginPath();
    c.moveTo(0, -h);
    c.bezierCurveTo(w * 1.05, -h * 0.52, w * 0.86, h * 0.44, 0, h);
    c.bezierCurveTo(-w * 0.80, h * 0.40, -w * 0.98, -h * 0.46, 0, -h);
    c.closePath();
  }

  /* One tile per (tone x light level). The far side of the tile holds
     the real geometry; only its shadow is inside the frame. */
  function bake(tone, lit, S, dpr) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = S * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);

    var off = S * 2;                     /* push the geometry away */
    var cx = S / 2, cy = S / 2;
    var w = S * 0.20, h = S * 0.30;

    /* Golden at the top of the range — the brief's "golden
       highlights" are what the light does to a petal, not a fourth
       kind of petal. */
    var body = mix(tone, '#ffd9a2', lit * 0.55);
    var core = mix(tone, '#fffdf6', 0.35 + lit * 0.55);

    function blob(path, colour, alpha, blur, dx, dy) {
      c.save();
      c.shadowColor = colour + alpha + ')';
      c.shadowBlur = blur;
      c.shadowOffsetX = off;
      c.shadowOffsetY = 0;
      c.fillStyle = '#000';
      c.translate(cx - off + dx, cy + dy);
      path(c);
      c.fill();
      c.restore();
    }

    /* the halo the beam puts around a lit petal */
    if (lit > 0.34) {
      blob(function (g) { petalPath(g, w * 1.5, h * 1.4); },
           body, (0.05 + lit * 0.16).toFixed(3), S * 0.20, 0, 0);
    }
    /* the petal itself */
    blob(function (g) { petalPath(g, w, h); },
         body, (0.46 + lit * 0.44).toFixed(3), S * 0.075, 0, 0);
    /* a brighter core, shouldered toward the lit edge */
    blob(function (g) { petalPath(g, w * 0.52, h * 0.62); },
         core, (0.36 + lit * 0.52).toFixed(3), S * 0.038, w * 0.16, -h * 0.10);

    return cv;
  }

  /* A soft streak for the light trails — the same trick, stretched. */
  function bakeStreak(S, dpr) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = S * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    var off = S * 2;
    c.save();
    c.shadowColor = 'rgba(255,238,206,0.30)';
    c.shadowBlur = S * 0.13;
    c.shadowOffsetX = off;
    c.fillStyle = '#000';
    c.translate(S / 2 - off, S / 2);
    c.beginPath();
    c.ellipse(0, 0, S * 0.035, S * 0.30, 0, 0, TAU);
    c.fill();
    c.restore();
    return cv;
  }

  /* ------------------------------------------------------------
     R.petals(opts)

       canvas    the <canvas> to own
       plate     { w, h, ox, oy }  intrinsic size + object-position,
                 so frame coordinates survive `object-fit: cover`
       band      { top, height } for a portrait plate, whose picture
                 is a band inside its own blurred fill
       seed      deterministic, so the field is identical every load
       count     pool size
       bursts    [{ q, x, y, n, power, ring }]
       ambient   { from, to, n }
       shaft(q)  { tx, bx, w } in frame %, the beam the light is in
       level(q)  0..1, how much light there is to catch
       tones     [hex, ...]
     ------------------------------------------------------------ */
  R.petals = function (opts) {
    var cv = opts.canvas;
    if (!cv || !cv.getContext) return null;

    var ctx = cv.getContext('2d', { alpha: true });
    if (!ctx) return null;

    var REDUCED = R.reduced;
    var TONES = opts.tones || ['#fbf7f2', '#f7e9cf', '#f3d9d4'];
    var LEVELS = 4;
    /* Sized to what is actually drawn. Nearly every petal lands at
       12-40 css px and the largest at about 90, so a 48 tile upscales
       only the few near ones — which are the soft, out-of-focus ones
       anyway. A 72 tile spent the difference filtering downwards on
       every blit of every frame. */
    var SPRITE = 48;

    var sprites = null, streak = null, dpr = 1;
    var cw = 0, ch = 0;               /* CSS pixels */
    var map = null;                   /* frame % -> css px */
    var pool = [], rings = [], trails = [], glints = [];
    var wasBlank = false;

    /* ---------- cover / band mapping --------------------------
       The plate is drawn with `object-fit: cover`, so a frame
       coordinate is not a viewport coordinate: the picture is scaled
       to the binding axis and bled off the other one. Getting this
       wrong is not subtle — the bursts would leave her feet and climb
       the wall the moment the window changed shape. */
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
        s: bh * 0.01                  /* one frame-% as css px */
      };
    }

    /* ---------- the pool --------------------------------------
       Built once. `birth` and `life` are in q, never in seconds. */
    function build() {
      var rnd = util.rng(opts.seed || 1);
      var total = opts.count;
      pool.length = 0;

      var bursts = opts.bursts || [];
      var burstShare = 0, i, j, b;
      for (i = 0; i < bursts.length; i++) burstShare += bursts[i].n;

      for (i = 0; i < bursts.length; i++) {
        b = bursts[i];
        for (j = 0; j < b.n; j++) {
          /* Fanned outward and up. The spread in birth is tight — a
             burst has to read as one event, not a trickle. */
          var a = pick(rnd, -2.62, -0.52);          /* up and out */
          var sp = pick(rnd, 0.45, 1) * b.power;
          /* Depth. rnd()*rnd() is biased low, so most of the field is
             far — small, crisp, and holding still in the frame — and a
             few are near the lens: much bigger, softer for being scaled
             up from the same sprite, dimmer for being out of focus, and
             falling faster because they are closer. Without this the
             field is one size and reads as confetti. */
          var dep = rnd() * rnd();
          pool.push({
            burst: 1,
            birth: b.q + pick(rnd, 0, 0.014),
            life:  pick(rnd, 0.15, 0.33),
            ox: b.x + pick(rnd, -3.4, 3.4),
            oy: b.y + pick(rnd, -1.6, 1.6),
            vx: Math.cos(a) * sp * 46,
            vy: Math.sin(a) * sp * 40,
            g:  pick(rnd, 52, 104),
            sway: pick(rnd, 1.2, 4.4),
            swf: pick(rnd, 1.6, 3.6),
            swp: pick(rnd, 0, TAU),
            r0: pick(rnd, 0, TAU),
            spin: pick(rnd, -3.4, 3.4),
            tum: pick(rnd, 0, TAU),
            tsp: pick(rnd, 2.2, 6.4),
            sz: 0.40 + dep * 1.45,
            ar: pick(rnd, 0.72, 1.28),
            tone: (rnd() * TONES.length) | 0,
            dim: pick(rnd, 0.64, 1) * (1 - dep * 0.40)
          });
        }
      }

      /* The drift. Spread evenly across its window so the fall is
         continuous rather than arriving in a clump — this is the
         "high quantity, low intensity" half of the brief. */
      var am = opts.ambient;
      var n = Math.max(0, total - burstShare);
      for (i = 0; i < n; i++) {
        var t = n < 2 ? 0 : i / (n - 1);
        var dp = rnd() * rnd();
        /* Where they come in. Not uniform: three in five enter over
           the top of the beam, because petals carried on the light
           should arrive with it — a flat distribution across the
           width reads as weather, which this room does not have. */
        var onBeam = rnd() < 0.60;
        pool.push({
          burst: 0,
          birth: am.from + (am.to - am.from) * t + pick(rnd, -0.02, 0.02),
          life:  pick(rnd, 0.20, 0.46),
          ox: onBeam ? pick(rnd, 44, 100) : pick(rnd, -8, 108),
          oy: pick(rnd, -18, -2),
          vx: pick(rnd, -21, 7),
          vy: pick(rnd, 74, 138) * (0.72 + dp * 0.80),
          g: 0,
          sway: pick(rnd, 1.8, 6.5),
          swf: pick(rnd, 1.1, 2.9),
          swp: pick(rnd, 0, TAU),
          r0: pick(rnd, 0, TAU),
          spin: pick(rnd, -2.2, 2.2),
          tum: pick(rnd, 0, TAU),
          tsp: pick(rnd, 1.4, 4.2),
          sz: 0.26 + dp * 1.60,
          ar: pick(rnd, 0.70, 1.30),
          tone: (rnd() * TONES.length) | 0,
          dim: pick(rnd, 0.46, 0.96) * (1 - dp * 0.46)
        });
      }

      /* --- the graphic elements, all q-driven like everything else */

      /* Rings: the light meeting the floor. Only on the beats that
         earn one, and flattened, because the floor is a plane seen
         at a rake. */
      rings.length = 0;
      for (i = 0; i < bursts.length; i++) {
        if (!bursts[i].ring) continue;
        rings.push({ q: bursts[i].q, x: bursts[i].x, y: bursts[i].y,
                     life: 0.075, r: bursts[i].ring });
      }

      /* Trails: a few long, slow streaks lying along the beam. */
      trails.length = 0;
      for (i = 0; i < (REDUCED ? 0 : 5); i++) {
        trails.push({
          u: pick(rnd, 0.08, 0.92),
          d: pick(rnd, -0.30, 0.30),
          len: pick(rnd, 0.5, 1.25),
          w: pick(rnd, 0.55, 1.15),
          op: pick(rnd, 0.30, 0.72),
          ph: pick(rnd, 0, TAU)
        });
      }

      /* Glints: sharp points that live only inside the beam. */
      glints.length = 0;
      for (i = 0; i < (REDUCED ? 0 : 9); i++) {
        glints.push({
          u: pick(rnd, 0.10, 0.94),
          d: pick(rnd, -0.72, 0.72),
          sz: pick(rnd, 0.16, 0.42),
          op: pick(rnd, 0.34, 0.9),
          ph: pick(rnd, 0, TAU)
        });
      }
    }

    /* ---------- sizing ---------------------------------------- */
    function resize() {
      var r = cv.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width));
      var h = Math.max(1, Math.round(r.height));
      var d = Math.min(window.devicePixelRatio || 1, 2);
      if (w === cw && h === ch && d === dpr && sprites) return;

      cw = w; ch = h;
      if (d !== dpr || !sprites) {
        dpr = d;
        sprites = [];
        for (var t = 0; t < TONES.length; t++) {
          var row = [];
          for (var l = 0; l < LEVELS; l++) {
            row.push(bake(TONES[t], l / (LEVELS - 1), SPRITE, dpr));
          }
          sprites.push(row);
        }
        streak = bakeStreak(SPRITE, dpr);
      }

      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
      remap();
      wasBlank = false;
    }

    /* ---------- draw ------------------------------------------
       Called from the chapter's paint pass, so it runs on the same
       frame as the seek and stops when the loop stops. */
    function draw(q) {
      if (!map) return;

      var lvl = opts.level ? clamp01(opts.level(q)) : 1;
      var i, p, u;

      if (lvl <= 0.001) {
        if (!wasBlank) { ctx.clearRect(0, 0, cv.width, cv.height); wasBlank = true; }
        return;
      }
      wasBlank = false;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      var sh = opts.shaft ? opts.shaft(q) : null;
      var px = map.x, py = map.y, ps = map.s;

      /* --- the beam's own graphics, behind the petals ---------- */
      if (sh && !REDUCED) {
        var ax = px(sh.tx), ay = py(-6);
        var bx = px(sh.bx), by = py(104);
        var vx = bx - ax, vy = by - ay;
        var vlen = Math.sqrt(vx * vx + vy * vy) || 1;
        var nx = -vy / vlen, ny = vx / vlen;
        var half = sh.w * 0.5 * ps;

        ctx.globalCompositeOperation = 'lighter';

        for (i = 0; i < trails.length; i++) {
          var tr = trails[i];
          /* Trails ease down the beam with the scroll and nothing
             else — no clock, so they hold when the film holds. */
          var tu = (tr.u + q * 0.30) % 1;
          var tx = ax + vx * tu + nx * tr.d * half;
          var ty = ay + vy * tu + ny * tr.d * half;
          var fade = Math.sin(tu * Math.PI);
          ctx.globalAlpha = tr.op * lvl * fade * 0.42;
          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(Math.atan2(vy, vx) - Math.PI / 2);
          ctx.scale(tr.w, tr.len * 2.4);
          ctx.drawImage(streak, -SPRITE / 2, -SPRITE / 2, SPRITE, SPRITE);
          ctx.restore();
        }

        for (i = 0; i < glints.length; i++) {
          var gl = glints[i];
          var gu = (gl.u + q * 0.11) % 1;
          var gx = ax + vx * gu + nx * gl.d * half;
          var gy = ay + vy * gu + ny * gl.d * half;
          /* they breathe against the scroll, not against a timer */
          var puls = 0.55 + 0.45 * Math.sin(gl.ph + q * 26);
          ctx.globalAlpha = gl.op * lvl * puls * Math.sin(gu * Math.PI) * 0.5;
          var g3 = sprites[0][LEVELS - 1];
          var gs = gl.sz * SPRITE * 0.5;
          ctx.drawImage(g3, gx - gs / 2, gy - gs / 2, gs, gs);
        }

        /* Rings: one soft ellipse where the light lands, on the
           beats big enough to deserve it. */
        for (i = 0; i < rings.length; i++) {
          var rg = rings[i];
          var ru = (q - rg.q) / rg.life;
          if (ru <= 0 || ru >= 1) continue;
          var rr = rg.r * ps * (0.25 + ru * 1.5);
          var ra = (1 - ru) * (1 - ru) * lvl;
          ctx.strokeStyle = 'rgba(255,226,178,1)';
          /* two passes, a wide soft one under a narrow one — a single
             stroke at this scale reads as a drawn ellipse */
          ctx.globalAlpha = ra * 0.13;
          ctx.lineWidth = Math.max(2, ps * 1.5 * (1 - ru));
          ctx.beginPath();
          ctx.ellipse(px(rg.x), py(rg.y), rr, rr * 0.30, 0, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = ra * 0.16;
          ctx.lineWidth = Math.max(1, ps * 0.42 * (1 - ru));
          ctx.beginPath();
          ctx.ellipse(px(rg.x), py(rg.y), rr * 0.97, rr * 0.29, 0, 0, TAU);
          ctx.stroke();
        }

        ctx.globalCompositeOperation = 'source-over';
      }

      /* --- the petals ----------------------------------------- */
      var sax = 0, say = 0, sbx = 0, sby = 0, slen = 1, shalf = 1;
      if (sh) {
        sax = px(sh.tx); say = py(-6);
        sbx = px(sh.bx); sby = py(104);
        var ddx = sbx - sax, ddy = sby - say;
        slen = ddx * ddx + ddy * ddy || 1;
        shalf = Math.max(1, sh.w * 0.5 * ps);
      }

      /* The hot loop. Three things keep it cheap enough to run beside
         a video seek on the same frame:

         - one `setTransform` per petal instead of save / translate /
           rotate / scale / restore. Five context calls and two stack
           pushes became one, and the matrix is the composition of the
           dpr base with the petal's own, worked out by hand below.
         - a rational falloff for the beam rather than exp(-d^2), and
           the distance kept squared so there is no sqrt either. The
           curve is not the same Gaussian, but it is the same shape to
           the eye and it decides a 4-level sprite index.
         - no allocation: every intermediate is a hoisted local, so a
           full sweep of the section makes no garbage at all. */
      var dx2 = sbx - sax, dy2 = sby - say;
      var invHalf2 = 1 / (shalf * shalf);
      /* A portrait plate is a band of picture inside its own blurred
         fill. Petals belong in the picture, so they fade out at the
         seam rather than carrying on across the blur — falling over
         the surround reads as petals in front of the screen instead
         of in the room with her. The plate's seam is feathered, so
         this is too. */
      var band = !!opts.band;

      for (i = 0; i < pool.length; i++) {
        p = pool[i];
        u = (q - p.birth) / p.life;
        if (u <= 0 || u >= 1) continue;

        var fx = p.ox + p.vx * u + p.sway * Math.sin(p.swf * u * TAU + p.swp);
        var fy = p.oy + p.vy * u + p.g * u * u;
        if (fy < -24 || fy > 126 || fx < -18 || fx > 118) continue;

        var x = px(fx), y = py(fy);

        /* how deep in the beam it is — the perpendicular distance from
           the shaft's axis, which is what decides its sprite */
        var lit = 0;
        if (sh) {
          var t2 = ((x - sax) * dx2 + (y - say) * dy2) / slen;
          t2 = t2 < 0 ? 0 : t2 > 1 ? 1 : t2;
          var qx = x - (sax + dx2 * t2);
          var qy = y - (say + dy2 * t2);
          lit = 1 / (1 + (qx * qx + qy * qy) * invHalf2 * 1.9);
        }

        /* in over the first breath, out over the last quarter */
        var fade2 = u < 0.10 ? u / 0.10 : u > 0.74 ? (1 - u) / 0.26 : 1;

        var a2 = fade2 * p.dim * lvl * (0.62 + lit * 0.38);
        if (band) {
          a2 *= fy < 7 ? (fy + 7) * 0.0714 : fy > 93 ? (107 - fy) * 0.0714 : 1;
        }
        if (a2 < 0.006) continue;
        ctx.globalAlpha = a2 > 1 ? 1 : a2;

        var lv = (lit * (LEVELS - 1) + 0.5) | 0;
        if (lv > LEVELS - 1) lv = LEVELS - 1;

        var s = p.sz * SPRITE * (0.55 + lit * 0.16);
        /* the tumble: a petal turning over loses width, never all of
           it — a sliver reads as a fold, zero reads as a dropped frame */
        var tw = (0.28 + 0.72 * Math.abs(Math.cos(p.tum + p.tsp * u * TAU))) * p.ar;

        var rot = p.r0 + p.spin * u;
        var co = Math.cos(rot), si = Math.sin(rot);
        /* base(dpr) x translate(x,y) x rotate(rot) x scale(tw,1) */
        ctx.setTransform(dpr * co * tw, dpr * si * tw,
                         dpr * -si,     dpr * co,
                         dpr * x,       dpr * y);
        ctx.drawImage(sprites[p.tone][lv], -s * 0.5, -s * 0.5, s, s);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
    }

    build();
    resize();

    return {
      draw: draw,
      resize: resize,
      rebuild: function () { build(); resize(); },
      clear: function () { ctx.clearRect(0, 0, cv.width, cv.height); wasBlank = true; }
    };
  };
})();
