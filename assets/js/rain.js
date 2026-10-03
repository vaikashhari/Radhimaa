/* ============================================================
   RADHIMAA — SCENE 05 · A NIGHT THAT STAYED ON

   Same transport as the chapters around it (scrub.js). What is here
   is this chapter's beats, the curve the lights wake along, and the
   world that hangs in front of the plate — which lives in lumen.js.

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

     `Section 5.mov` — 1180x2088, sideways again, 101 unique frames
     over 3.19s (~32fps). Rotated back it is 2088x1180.

     Nothing is trimmed. Its opening mist is the join from Scene 04,
     which dissolves into exactly that, and its warm bloom is the join
     to Scene 06 — both ends are load-bearing. Retimed 1.4x and
     interpolated to 60fps: 263 frames over 4.38s. Checked on the
     swirl, which is the highest-motion content in the building; the
     rain droplets survive it, which is the hardest thing in a frame
     to interpolate.

     Measured on the shipped plate:
       T 0.00-0.70   L 158 -> 66    the pale mist clearing
       T 0.90        L  58          the night settling
       T 1.20-2.70   L  36          the deep night, flat to the point
       T 2.85        L  34          the darkest frame in the film
       T 3.15-3.90   L  53 -> 86    the bokeh swirl
       T 4.05-4.38   L 153 -> 173, R-B +60   the warm bloom

     Two numbers decide the whole chapter. The night sits at **L 36
     and does not move for a second and a half** — the flattest,
     darkest stretch in the building, and therefore the only place in
     the film where a small light can genuinely arrive. And its
     activity map over that stretch reads 0-2 everywhere, so nothing
     added has to fight the picture for attention.

     No `curve`. This is the one plate with continuous motion all the
     way through — the dance never stops — so there is no dead stretch
     for a ramp to skip past.
     ------------------------------------------------------------ */
  var PLATE_END = 4.38;
  var LEAD_IN  = 0.060;
  var LEAD_OUT = 0.900;

  var PLATES = {
    wide:     { ar: 2088 / 1180, hi: 1500, lo: 'rain-desktop.mp4', hiSrc: 'rain-desktop-2x.mp4' },
    portrait: { ar: 1080 / 2160, hi: 900,  lo: 'rain-mobile.mp4',  hiSrc: 'rain-mobile-2x.mp4' }
  };

  /* linear map, so a moment in the footage is one line of arithmetic */
  function qAt(t) { return LEAD_IN + clamp01(t / PLATE_END) * (LEAD_OUT - LEAD_IN); }

  /* ------------------------------------------------------------
     TIMELINE

     The plate's own events land at:
       q 0.19   T 0.70   the mist has cleared
       q 0.23   T 0.90   the night settles
       q 0.29   T 1.20   the deep night begins
       q 0.58   T 2.70   it ends
       q 0.61   T 2.85   the darkest frame
       q 0.66   T 3.15   the swirl begins
       q 0.73   T 3.50   it peaks
       q 0.84   T 4.05   the bloom
       q 0.90   T 4.38   the last frame

     The type lives inside the night and is gone before the swirl is
     full. That is not only composition: the swirl takes the frame
     from L 34 to L 86 and the right-hand column with it, and cream
     does not survive that. The swirl is also the best thing in the
     plate and does not want words across it.
     ------------------------------------------------------------ */
  var BEAT = {
    open:    [0.230, 0.286, 0.352, 0.400],

    glow:    [0.410, 0.500, 0.645, 0.700],
    mainL1:  [0.410, 0.497, 0.648, 0.700],
    sub:     [0.478, 0.545, 0.640, 0.688]
  };

  /* ------------------------------------------------------------
     THE LIGHT TIMELINE

     §16's phases, against the plate rather than against a clock:

       0.00-0.21  the mist falls into night. Nothing is added — at
                  L 66-158 a small light has nothing to arrive out of.
       0.21-0.36  the first five, one at a time, by hand.
       0.36-0.58  the rest wake through the flat deep night; the type
                  arrives at 0.41.
       0.58-0.72  full, and the swirl begins under them.
       0.72-0.86  the swirl peaks — the strongest moment in the plate
                  and the most lights on screen.
       0.86-0.95  they calm, the bloom takes the frame, a few are
                  still burning when the chapter lets go.

     `mid` is flat at 1: the fireflies are the chapter and their
     progression is in when they are *born*, not in how far up a dial
     they are turned. Dimming a light to make it late makes it a weak
     light, not an early one.
     ------------------------------------------------------------ */
  function levels(q) {
    return {
      all:   trap(q, [0.208, 0.242, 0.902, 0.952]),
      far:   ease(ramp(q, 0.250, 0.470)),
      mid:   1,
      near:  ease(ramp(q, 0.330, 0.560)),
      spark: trap(q, [0.300, 0.430, 0.860, 0.930])
    };
  }

  /* §04 — one small light, then another, then more.

     The first five are placed by hand rather than sampled, in ground
     the luminance map measures at L 0-27, and spaced about 0.03 apart
     in q so each one is its own event rather than part of a fade-in.
     Everything after them is a distribution (see lumen.js), which is
     what turns five arrivals into a night. */
  var FIRST = [
    { q: 0.236, x: 57, y: 56, sz: 0.95, tone: 0 },   /* gold */
    { q: 0.263, x: 13, y: 70, sz: 0.80, tone: 1 },   /* warm white */
    { q: 0.289, x: 44, y: 82, sz: 1.05, tone: 0 },
    { q: 0.313, x: 30, y: 46, sz: 0.72, tone: 3 },   /* pale blue */
    { q: 0.337, x: 65, y: 72, sz: 0.90, tone: 2 }    /* lavender */
  ];

  /* Counted on screen rather than guessed at. These run 0 lights at
     q 0.22, one at 0.25, five by 0.34, and peak near 150 across the
     back of the night — full, but a long way short of the neon §17
     rules out. */
  var COUNT = {
    wide:     { far: 126, mid: 74, near: 14, spark: 36 },
    portrait: { far: 56,  mid: 33, near: 6,  spark: 16 }
  };

  /* Their faces, off the luminance map: he runs x 22-34% and she
     x 34-50%, heads between y 18% and 44%. Lights still drift across,
     they just thin as they do — the couple are the subject and the
     lights are the weather. */
  var AVOID = { x0: 20, x1: 52, y0: 18, y1: 44 };

  /* ------------------------------------------------------------ */

  var sec = document.getElementById('rainfall');
  if (!sec) return;

  var video = document.getElementById('rainVideo');
  var el = {
    plate: document.getElementById('rainPlate'),
    night: document.getElementById('rainNight'),
    lit:   document.getElementById('rainLit'),
    bloom: document.getElementById('rainBloom'),
    edge:  document.getElementById('rainEdge'),
    lite:  document.getElementById('rainLite'),
    fore:  document.getElementById('rainFore'),
    open:  document.getElementById('rainOpen'),
    main:  document.getElementById('rainMain'),
    mainH: document.getElementById('rainMainH'),
    sub:   document.getElementById('rainSub')
  };

  var mainLines = [];
  var world = null;
  var qNow = 0;

  /* A dev handle. With no arguments it reports what is on screen;
     with a q and a fixed clock it forces one draw, which is how the
     field's independence from scroll history is tested. */
  R._rain = function (q, clock) {
    if (!world) return null;
    if (q != null) world.draw(q, clock || 0);
    return world.stats(q == null ? qNow : q);
  };

  /* ------------------------------------------------------------
     THE WORLD
     ------------------------------------------------------------ */
  function buildWorld(portrait) {
    if (!el.lite || !R.lumen) return;

    var c = portrait ? COUNT.portrait : COUNT.wide;
    if (R.reduced) {
      c = { far: Math.round(c.far * .45), mid: Math.round(c.mid * .45),
            near: Math.round(c.near * .45), spark: Math.round(c.spark * .45) };
    }

    world = R.lumen({
      back: el.lite,
      front: el.fore,
      /* the plate's intrinsic size and object-position, so a frame
         coordinate survives `object-fit: cover` on any window */
      plate: portrait
        ? { w: 1080, h: 2160, ox: 0.5, oy: 0.5 }
        : { w: 2088, h: 1180, ox: 0.5, oy: 0.42 },
      /* the portrait plate is a band of picture inside its own
         blurred fill — measured at y 25.8-53.5% as row sharpness */
      band: portrait ? { top: 0.258, height: 0.277 } : null,
      seed: 5082025,
      counts: c,
      first: FIRST,
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

    /* Scene 04 settles into light and this opens out of the same
       mist — the two plates meet at L 210 / L 158, both around
       R-B -50, so the handover is a continuation rather than a cut. */
    var enter = ease(ramp(q, 0, 0.085));
    put(el.plate, '--renter', enter);

    /* Depth through the night, and strongest exactly where the plate
       is flattest — a light only pops out of ground that is dark
       enough to pop out of. Out of the way by the swirl. */
    put(el.night, '--rnight', trap(q, [0.140, 0.300, 0.620, 0.760]));

    /* §05 — the atmosphere the lights wake. It rises with them,
       holds across the peak and eases back. */
    var lit = trap(q, [0.260, 0.520, 0.840, 0.930]);
    put(el.lit,  '--rlit', lit);
    /* and the same value reaches the typography, which is read by
       this light rather than merely placed in front of it */
    put(el.main, '--rlit', lit);

    /* The bloom the plate makes for itself, carried a half-step
       further and no more. */
    put(el.bloom, '--rbloom', ease(ramp(q, 0.800, 0.898)));

    /* --- the type ----------------------------------------------- */
    put(el.open, '--mt', trap(q, BEAT.open));
    put(el.main, '--mt', trap(q, BEAT.glow));
    if (mainLines[0]) put(mainLines[0], '--mt', trap(q, BEAT.mainL1));
    put(el.sub,  '--mt', trap(q, BEAT.sub));

    /* Under reduced motion the world is drawn from here and the idle
       loop below never starts, so nothing in the chapter moves except
       in answer to the scrollbar. */
    if (R.reduced && world) world.draw(q, 0);

    /* §19: the type is gone by 0.700 and the lights are still burning
       at 0.90, so the last frame is held with a few of them alive on
       it before anything happens to it. The release is into the
       plate's own warm bloom, not into black — Scene 06 opens on a
       burning sky and has somewhere to begin. */
    put(el.edge, '--redge', ease(ramp(q, 0.955, 1)));

    sec.classList.toggle('rain--in', enter > 0.999);
  }

  /* ------------------------------------------------------------
     THE WORLD'S OWN LOOP

     scrub's loop settles the moment the scrollbar does, which is
     right for the plate and wrong for a night: a light that holds
     perfectly still is a dot. So the canvases are driven from here
     instead, on their own rAF while the section is on screen, and
     throttled to film rate once the scroll has settled — the pulse
     and the flicker are all that is still changing then, and 24fps
     is a third of the work for a difference nobody can see.

     Position still comes only from q. The clock reaches brightness
     and nothing else.
     ------------------------------------------------------------ */
  var raf = null, drawnQ = -1, drawnT = -1;
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
      outClass:  'rain--out',
      liveClass: 'rain-live'
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
