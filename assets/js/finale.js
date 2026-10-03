/* ============================================================
   RADHIMAA — SCENE 06 · AFTER EVERYTHING

   The last chapter, and the largest of them. Same transport as the
   four before it (scrub.js); what is here is its beats, the curve the
   flowers open along, and the field itself — which lives in bloom.js.

   The copy is in index.html so the section still reads without JS.
   ============================================================ */
(function () {
  'use strict';

  var R = window.Radhimaa;
  if (!R) return;

  var ramp = R.util.ramp, ease = R.util.ease, trap = R.util.trap,
      put = R.util.put, clamp01 = R.util.clamp01;

  /* ------------------------------------------------------------
     THE PLATE

     `Section 6.mov` — 1180x2078, sideways like the rest, and the
     shortest of them: 76 unique frames over 2.51s. Retimed 1.5x and
     interpolated to 60fps gives 224 frames over 3.73s, which is three
     synthetic frames for every real one — more than anywhere else in
     the film. Checked on the fabric sweep, which is the fastest thing
     in it; the cloth stays coherent and the tableau behind it is
     untouched, because the tableau barely moves.

     Measured on the shipped plate:
       T 0.00        L 135, R-B +73   the pink haze Scene 05 hands over
       T 0.15-0.45   L  61 ->  43     black fabric sweeps in
       T 0.60-2.40   L  75 ->  93, R-B +50 -> +60   the tableau
       T 2.55-3.45   L  94 -> 126, R-B -> **+81**   the push-in

     +81 makes it the warmest plate in the building by a wide margin,
     and the tableau measures activity 0-4 across almost the whole
     frame — the stillest as well. Both of those are what let the
     typography sit in the sky and stay there, and what let a field of
     flowers hang in front of it without fighting the picture.

     The frame is two grounds, not one: a burning sky at L 95-197
     across the top half, a crowd and a dais at L 1-40 below it. Every
     flower has to be an object on both, which is why each petal
     carries a rim — the same lesson Scene 04's butterflies taught.
     ------------------------------------------------------------ */
  var PLATE_END = 3.73;
  var LEAD_IN  = 0.060;
  var LEAD_OUT = 0.900;

  var PLATES = {
    wide:     { ar: 2078 / 1180, hi: 1500, lo: 'finale-desktop.mp4', hiSrc: 'finale-desktop-2x.mp4' },
    portrait: { ar: 1080 / 2160, hi: 900,  lo: 'finale-mobile.mp4',  hiSrc: 'finale-mobile-2x.mp4' }
  };

  function qAt(t) { return LEAD_IN + clamp01(t / PLATE_END) * (LEAD_OUT - LEAD_IN); }

  /* ------------------------------------------------------------
     TIMELINE

     Linear. The plate's own events land at:
       q 0.16   T 0.45   the fabric has passed
       q 0.20   T 0.60   the tableau settles
       q 0.57   T 2.25   it is still settling
       q 0.63   T 2.55   the push-in starts
       q 0.84   T 3.45   the warmest, brightest frame
       q 0.90   T 3.73   the last frame

     The type holds across the tableau and is gone before the end of
     the push-in, so the last of the film plays with nothing on it.
     That is the last thing anyone sees of the story and it should be
     only them, the flowers, and the light.
     ------------------------------------------------------------ */
  var BEAT = {
    open:   [0.215, 0.272, 0.336, 0.382],

    glow:   [0.380, 0.470, 0.700, 0.772],
    mainL1: [0.380, 0.467, 0.703, 0.772],
    sub:    [0.446, 0.512, 0.696, 0.760]
  };

  /* ------------------------------------------------------------
     THE BUILD-UP

     §11 asks for the largest visual payoff in the building, and for
     it to arrive rather than simply be present:

       0.00-0.20  the fabric passes and the tableau resolves. A few
                  background flowers, no more — they are back-loaded
                  in bloom.js, so the count is low here by
                  construction rather than by dimming.
       0.20-0.45  colour opens back up after Scene 05's night; the
                  midground fills; the petal fall begins; type arrives.
       0.45-0.72  the peak. Everything on, text at full clarity, the
                  sunset reaching the flowers.
       0.72-0.88  the push-in, the warmest frame, the foreground
                  crossing the lens — the strongest moment.
       0.88-0.97  §13: the flowers settle, the petals drift away, the
                  light softens, and the frame is handed to the ending.
     ------------------------------------------------------------ */
  function levels(q) {
    return {
      /* §13 asks for the field to settle before the frame is handed
         on, and an earlier cut still had it at 62% strength on the
         last frame — which is not a settle, it is a cut. The flowers
         now begin thinning at 0.80, well before the close-up, so the
         last thing anyone sees of the film is the two of them. */
      all:    trap(q, [0.100, 0.180, 0.800, 0.900]),
      flower: ease(ramp(q, 0.140, 0.420)) * (1 - 0.85 * ease(ramp(q, 0.780, 0.895))),
      petal:  trap(q, [0.170, 0.340, 0.790, 0.895]),
      spark:  trap(q, [0.300, 0.460, 0.770, 0.870]),
      /* how far the sunset has come up — the plate's own L 75 -> 126 */
      lit:    ease(ramp(q, 0.200, 0.720))
    };
  }

  /* Counted on screen rather than guessed at. §03 asks for much
     richer than Scene 03 and §06 for significantly more petals than
     it had — Scene 03 peaked near 260 petals and no flowers at all. */
  var COUNT = {
    wide:     { far: 60, mid: 44, near: 13, petal: 1400, fore: 16, spark: 34 },
    /* Portrait carries more than a straight scale-down would give it:
       the picture there is a band about a quarter of the screen tall,
       so the same counts read as a scattering rather than the
       abundance §23 asks to preserve. */
    portrait: { far: 38, mid: 28, near: 8,  petal: 820,  fore: 8,  spark: 18 }
  };

  /* The two of them hold at x 39-41% for almost the whole plate,
     measured as the brightest column of the band y 42-70% — he is in
     white. Background and midground flowers thin across that column,
     which is what reads as being behind them. */
  var AVOID = { x0: 30, x1: 58, y0: 22, y1: 78 };

  /* ------------------------------------------------------------ */

  var sec = document.getElementById('finale');
  if (!sec) return;

  var video = document.getElementById('finVideo');
  var el = {
    plate: document.getElementById('finPlate'),
    deep:  document.getElementById('finDeep'),
    burn:  document.getElementById('finBurn'),
    rose:  document.getElementById('finRose'),
    edge:  document.getElementById('finEdge'),
    flow:  document.getElementById('finFlow'),
    fore:  document.getElementById('finFore'),
    open:  document.getElementById('finOpen'),
    main:  document.getElementById('finMain'),
    mainH: document.getElementById('finMainH'),
    sub:   document.getElementById('finSub')
  };

  var mainLines = [];
  var world = null;
  var qNow = 0;

  R._fin = function (q, clock) {
    if (!world) return null;
    if (q != null) world.draw(q, clock || 0);
    return world.stats(q == null ? qNow : q);
  };

  /* ------------------------------------------------------------ */
  function buildWorld(portrait) {
    if (!el.flow || !R.bloom) return;

    var c = portrait ? COUNT.portrait : COUNT.wide;
    if (R.reduced) {
      c = { far: Math.round(c.far * .45), mid: Math.round(c.mid * .45),
            near: Math.round(c.near * .45), petal: Math.round(c.petal * .45),
            fore: Math.round(c.fore * .45), spark: Math.round(c.spark * .45) };
    }

    world = R.bloom({
      back: el.flow,
      front: el.fore,
      plate: portrait
        ? { w: 1080, h: 2160, ox: 0.5, oy: 0.5 }
        : { w: 2078, h: 1180, ox: 0.5, oy: 0.40 },
      /* the portrait plate is a band of picture inside its own
         blurred fill — measured at y 26.4-54.8% as row sharpness */
      band: portrait ? { top: 0.264, height: 0.284 } : null,
      seed: 6082025,
      counts: c,
      levels: levels,
      avoid: AVOID
    });
  }

  function mountCopy() {
    R.util.mirrorLines(sec);
    mainLines = el.mainH ? el.mainH.querySelectorAll('.ln') : [];
  }

  /* ------------------------------------------------------------
     PAINT
     ------------------------------------------------------------ */
  function paint(q) {
    qNow = q;

    /* Scene 05 ends in its own warm bloom and this opens on a burning
       sky — L 173 / +61 handing to L 135 / +73. The fade-up crosses
       almost nothing. */
    var enter = ease(ramp(q, 0, 0.085));
    put(el.plate, '--fenter', enter);

    /* A little weight while the fabric is still moving. */
    put(el.deep, '--fdeep', trap(q, [0.070, 0.150, 0.300, 0.470]));

    /* A little more heat through the push-in, out of the way before
       the dissolve. */
    put(el.burn, '--fburn', trap(q, [0.400, 0.620, 0.830, 0.930]));

    /* §02 — the colour opening back up after the night. It comes in
       with the flowers and leaves with them. */
    put(el.rose, '--frose', trap(q, [0.180, 0.420, 0.800, 0.905]));

    /* How far the sunset has reached everything, including the type. */
    var lit = ease(ramp(q, 0.200, 0.720));
    put(el.main, '--flit', lit);

    /* --- the type ----------------------------------------------- */
    put(el.open, '--mt', trap(q, BEAT.open));
    put(el.main, '--mt', trap(q, BEAT.glow));
    if (mainLines[0]) put(mainLines[0], '--mt', trap(q, BEAT.mainL1));
    put(el.sub,  '--mt', trap(q, BEAT.sub));

    /* Under reduced motion the field is drawn from here and the idle
       loop below never starts, so nothing moves except in answer to
       the scrollbar. */
    if (R.reduced && world) world.draw(q, 0);

    /* §13 — the last release, and the only one that goes to black.
       The film opens on a held black frame and closes on the same
       thing. The type is gone by 0.772 and the field by 0.952, so the
       whole push-in and its last frame play with nothing over them,
       and the frame is dark before the ending begins. */
    /* The plate reaches its last frame at 0.900 and the field is gone
       by the same point, so the final composition is held clean for
       0.068 of the runway — about a third of a screen of scroll —
       before anything happens to it. §13 asks for the reader to be
       given time to absorb it, and an earlier cut allowed 86px. */
    put(el.edge, '--fedge', ease(ramp(q, 0.968, 1)));

    sec.classList.toggle('fin--in', enter > 0.999);
  }

  /* ------------------------------------------------------------
     THE FIELD'S OWN LOOP
     scrub's loop settles the instant the scrollbar does, which is
     right for the plate and wrong for a garden. Throttled to film
     rate once the scroll has settled — the sway is all that is still
     changing then. Position comes only from q; the clock reaches the
     sway and the glints and nothing else.
     ------------------------------------------------------------ */
  var raf = null, drawnQ = -1, drawnT = -1;
  /* 15fps at rest rather than the 24 the other chapters use. This is
     the heaviest field in the film — 684 objects at the peak — and at
     rest the *only* thing still changing is the sway, which runs at
     `clock * 0.5` and is far too slow to need more. The glints are
     driven by scroll, not by the clock, so they do not strobe. Held
     still, this took the section from 33% of a core to 28% against a
     26% baseline. */
  var IDLE_MS = 66;

  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (!world) return;
    if (qNow === drawnQ && t - drawnT < IDLE_MS) return;
    drawnQ = qNow; drawnT = t;
    world.draw(qNow, t * 0.001);
  }

  function run(on) {
    if (R.reduced) return;
    if (on && !raf) raf = requestAnimationFrame(frame);
    else if (!on && raf) { cancelAnimationFrame(raf); raf = null; }
  }

  function watch() {
    if (R.reduced) return;
    if (!('IntersectionObserver' in window)) { run(true); return; }
    new IntersectionObserver(function (e) {
      run(e[0].isIntersecting);
    }, { rootMargin: '15% 0px' }).observe(sec);
  }

  /* ------------------------------------------------------------ */
  function boot() {
    mountCopy();

    R.scrub({
      section:   sec,
      video:     video,
      plateEnd:  PLATE_END,
      leadIn:    LEAD_IN,
      leadOut:   LEAD_OUT,
      plates:    PLATES,
      paint:     paint,
      rebuild:   buildWorld,
      outClass:  'fin--out',
      liveClass: 'fin-live'
    });

    function refit() { if (world) world.resize(); }
    window.addEventListener('resize', refit, { passive: true });
    window.addEventListener('orientationchange', refit, { passive: true });
    window.addEventListener('load', refit);

    watch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
