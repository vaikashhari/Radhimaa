/* ============================================================
   RADHIMAA — SCENE 04 · EVERYTHING AT ONCE

   Same transport as the chapters around it (scrub.js). What is here
   is this chapter's beats, its colour timeline, and the world that
   hangs in front of the plate — which lives in wings.js.

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

     `Section 4.mov` is 1180x2082 — the same trick as Scene 03, 16:9
     landscape written sideways with no rotation flag. Rotated back
     it is 2082x1180, and 106 unique frames over 3.24s (~32fps).

     Trimmed at 0.26 to drop the whip past the wall, retimed 1.5x and
     motion-interpolated to 60fps: 263 frames over 4.38s. The crowd is
     the risky content for interpolation — dozens of small moving
     heads — so it was checked at 2x zoom there first.

     Measured on the shipped plate:
       T 0.00-0.55   L 142 -> 149   the crowd rising, whipped
       T 0.55-3.60   L 150-154      the sustained shot
       T 3.60-4.38   L 154 -> 209   the dissolve into cloud

     And, the number this whole chapter is cut to, its red-minus-blue:

       T 0.60   -5    the crimson crowd fills the lower frame
       T 1.20  -31
       T 2.20  -36
       T 3.20  -38    the crowd has sunk out, the sky owns it
       T 4.20  -46    dissolving into cloud

     The plate performs the red-to-blue transformation on its own. The
     butterflies ride that curve rather than imposing one.

     No `curve` here. Scene 03 needed one because two thirds of its
     plate was a held frame; this one has real motion at both ends and
     its still middle is exactly where the typography lives, so a
     linear map spends the runway where there is something to see.
     ------------------------------------------------------------ */
  var PLATE_END = 4.38;
  var LEAD_IN  = 0.060;
  var LEAD_OUT = 0.900;

  var PLATES = {
    wide:     { ar: 2082 / 1180, hi: 1500, lo: 'sky-desktop.mp4', hiSrc: 'sky-desktop-2x.mp4' },
    portrait: { ar: 1080 / 2160, hi: 900,  lo: 'sky-mobile.mp4',  hiSrc: 'sky-mobile-2x.mp4' }
  };

  /* linear map, so a moment in the footage is one line of arithmetic */
  function qAt(t) { return LEAD_IN + clamp01(t / PLATE_END) * (LEAD_OUT - LEAD_IN); }

  /* ------------------------------------------------------------
     TIMELINE

     The plate's own events land at:
       q 0.16   T 0.55   the crowd has settled
       q 0.30   T 1.25   the sustained shot is established
       q 0.48   T 2.20   the middle of it
       q 0.64   T 3.03   the last of the held shot
       q 0.75   T 3.60   the dissolve starts
       q 0.82   T 3.96   the bloom
       q 0.90   T 4.38   the last frame

     The type holds across the middle and is gone by 0.775, so the
     strongest butterfly moment — 0.80 to 0.92, where the reds turn —
     plays with nothing written over it.
     ------------------------------------------------------------ */
  var BEAT = {
    open:    [0.100, 0.150, 0.250, 0.300],

    glow:    [0.330, 0.440, 0.700, 0.775],
    mainL1:  [0.330, 0.437, 0.702, 0.775],
    sub:     [0.440, 0.520, 0.696, 0.760]
  };

  /* ------------------------------------------------------------
     THE COLOUR TIMELINE

     §19's phases, against the plate rather than against the clock:

       0.00-0.20  the shot establishes. A handful of reds, no more —
                  they are back-loaded in wings.js, so the count is
                  low here by construction rather than by dimming.
       0.20-0.40  reds fill in, the first petals, the type arrives.
       0.40-0.60  blues start entering; both lights are up, so this
                  is where the frame is genuinely violet.
       0.60-0.80  the peak. Everything on, text at full clarity.
       0.80-0.95  the turn: reds fade and a third of them change
                  colour outright; blue-violet takes the frame.
       0.95-1.00  settle, and release.
     ------------------------------------------------------------ */
  function levels(q) {
    return {
      all:   trap(q, [0.040, 0.150, 0.900, 0.950]),
      red:   ease(ramp(q, 0.050, 0.280)) * (1 - 0.90 * ease(ramp(q, 0.740, 0.910))),
      blue:  ease(ramp(q, 0.420, 0.660)),
      petal: trap(q, [0.170, 0.330, 0.855, 0.940]),
      mote:  trap(q, [0.260, 0.440, 0.840, 0.925]),
      /* how far through its change a turning butterfly is */
      morph: ease(ramp(q, 0.760, 0.880))
    };
  }

  /* §11: build and release rather than run flat. Four moments, each
     on something the plate is doing, and the largest on the last of
     the held shot — the emotional peak, before the dissolve takes it. */
  var PETAL_BEAT = [
    { q: qAt(1.25), n: 46,  power: 0.70 },   /* the shot settles */
    { q: qAt(2.20), n: 72,  power: 0.90 },   /* the middle */
    { q: qAt(3.03), n: 118, power: 1.00 },   /* the peak */
    { q: qAt(3.96), n: 84,  power: 0.85 }    /* through the bloom */
  ];

  /* Counted on screen rather than guessed at: the first cut peaked at
     21 butterflies, which is a few butterflies rather than the
     environment §04 asks for. These peak around 45-50 in frame, with
     two or three of the foreground layer crossing at any time. */
  var COUNT = {
    wide:     { far: 64, mid: 42, near: 18, petal: 470, fore: 16, mote: 64, escort: 9 },
    portrait: { far: 28, mid: 18, near: 7,  petal: 210, fore: 7,  mote: 30, escort: 4 }
  };

  /* The couple's column, off the luminance map: they run x 34-58%
     from y 26% down, against a sky at L 163-185. Far-layer butterflies
     dim across it, which is what reads as passing behind them. */
  var AVOID = { x0: 33, x1: 59, yTop: 26 };

  /* ------------------------------------------------------------ */

  var sec = document.getElementById('skyward');
  if (!sec) return;

  var video = document.getElementById('skyVideo');
  var el = {
    plate: document.getElementById('skyPlate'),
    deep:  document.getElementById('skyDeep'),
    warm:  document.getElementById('skyWarm'),
    lift:  document.getElementById('skyLift'),
    cold:  document.getElementById('skyCold'),
    edge:  document.getElementById('skyEdge'),
    pet:   document.getElementById('skyPet'),
    fore:  document.getElementById('skyFore'),
    open:  document.getElementById('skyOpen'),
    main:  document.getElementById('skyMain'),
    mainH: document.getElementById('skyMainH'),
    sub:   document.getElementById('skySub')
  };

  var mainLines = [];
  var world = null;
  var qNow = 0;

  /* A dev handle. With no arguments it reports what is on screen; with
     a q and a fixed wing clock it forces one draw, which is how the
     field's independence from scroll history is tested — the world
     holds no state between frames, and this is what proves it rather
     than asserting it. */
  R._sky = function (q, clock) {
    if (!world) return null;
    if (q != null) world.draw(q, clock || 0);
    return world.stats(q == null ? qNow : q);
  };

  /* ------------------------------------------------------------
     THE WORLD
     ------------------------------------------------------------ */
  function buildWorld(portrait) {
    if (!el.pet || !R.wings) return;

    var c = portrait ? COUNT.portrait : COUNT.wide;
    if (R.reduced) {
      c = { far: Math.round(c.far * .45), mid: Math.round(c.mid * .45),
            near: Math.round(c.near * .45), petal: Math.round(c.petal * .45),
            fore: Math.round(c.fore * .45), mote: Math.round(c.mote * .45) };
    }

    world = R.wings({
      back: el.pet,
      front: el.fore,
      /* the plate's intrinsic size and object-position, so a frame
         coordinate survives `object-fit: cover` on any window */
      plate: portrait
        ? { w: 1080, h: 2160, ox: 0.5, oy: 0.5 }
        : { w: 2082, h: 1180, ox: 0.5, oy: 0.42 },
      /* the portrait plate is a band of picture inside its own
         blurred fill — measured at y 26.7-54.3% as row sharpness */
      band: portrait ? { top: 0.267, height: 0.276 } : null,
      seed: 4082025,
      counts: c,
      levels: levels,
      petalBeats: PETAL_BEAT,
      avoid: AVOID,
      /* §18. Fourteen motes drift into a heart, hold, and scatter —
         once, off centre, in clean sky at x 78% / y 48% where the map
         reads L 167-171 at activity 0, and at an alpha most people
         will never consciously see. It is meant to be found, not
         shown. */
      heart: portrait ? null : { q: 0.612, life: 0.105, x: 78, y: 47, r: 5.4, n: 19 }
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

    /* Scene 03 releases into black and this opens out of it. */
    var enter = ease(ramp(q, 0, 0.090));
    put(el.plate, '--kenter', enter);

    /* Weight while the crowd is still rising. */
    put(el.deep, '--kdeep', 1 - ease(ramp(q, 0.120, 0.400)));

    /* §16 — the two halves of the light. They overlap deliberately
       across 0.44-0.66: that is where red and blue are both up and
       the frame goes violet, which is the transition rather than a
       cut between two grades. */
    put(el.warm, '--kwarm', trap(q, [0.100, 0.300, 0.660, 0.870]));
    put(el.cold, '--kcold', trap(q, [0.430, 0.700, 0.910, 0.958]));

    /* The bloom the plate makes for itself, carried a step further. */
    put(el.lift, '--klift', ease(ramp(q, 0.760, 0.905)));

    /* --- the type ----------------------------------------------- */
    put(el.open, '--mt', trap(q, BEAT.open));
    put(el.main, '--mt', trap(q, BEAT.glow));
    if (mainLines[0]) put(mainLines[0], '--mt', trap(q, BEAT.mainL1));
    put(el.sub,  '--mt', trap(q, BEAT.sub));

    /* Under reduced motion the world is drawn from here and the idle
       loop below never starts, so nothing in the chapter moves except
       in answer to the scrollbar — a wingbeat running on its own is
       exactly the autonomous motion that setting asks to be spared. */
    if (R.reduced && world) world.draw(q, 0);

    /* §23: let the world calm down, hold the last frame, then go.
       The type is gone by 0.775 and the butterflies by 0.950. */
    put(el.edge, '--kedge', ease(ramp(q, 0.958, 1)));

    sec.classList.toggle('sky--in', enter > 0.999);
  }

  /* ------------------------------------------------------------
     THE WORLD'S OWN LOOP

     scrub's loop settles the moment the scrollbar does, which is
     right for the plate and wrong for the swarm: a butterfly held
     mid-air with its wings stopped is a sticker, not a held frame.

     So the canvas is driven from here instead, on its own rAF while
     the section is on screen. Position still comes only from q — a
     held scroll holds every trajectory exactly where it was, and
     reversing retraces it — and the clock reaches nothing but the
     wingbeat. Off screen the loop stops dead, the same as scrub's.
     ------------------------------------------------------------ */
  var raf = null, drawnQ = -1, drawnT = -1;

  /* Measured before it was throttled: holding still on this section
     cost 57% of a core against a 35% baseline, all of it to keep the
     wings moving. While the scroll is live the world has to track it
     frame for frame — but once it settles the only thing still
     changing is the wingbeat, and that is perfectly happy at film
     rate. 24fps idle is a little over a third of the work for a
     difference nobody can see. */
  var IDLE_MS = 41;

  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (!world) return;
    if (qNow === drawnQ && t - drawnT < IDLE_MS) return;
    drawnQ = qNow;
    drawnT = t;
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
      outClass:  'sky--out',
      liveClass: 'sky-live'
    });

    /* scrub only rebuilds on a change of composition; the canvases
       also have to follow a plain resize, and `load` covers a frame
       measured before it had height. resize() is a no-op otherwise. */
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
