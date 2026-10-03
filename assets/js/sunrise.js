/* ============================================================
   RADHIMAA — SCENE 03 · THE LIGHT

   The transport is scrub.js, the same one Scene 02 runs on. What is
   here is only what belongs to this chapter: its beats, its light,
   its petal field and its paint pass.

   The copy is in index.html so the section still reads without JS.
   ============================================================ */
(function () {
  'use strict';

  var R = window.Radhimaa;
  if (!R) return;

  var clamp01 = R.util.clamp01, ramp = R.util.ramp, ease = R.util.ease,
      trap = R.util.trap, put = R.util.put, rng = R.util.rng, pick = R.util.pick;

  /* ------------------------------------------------------------
     THE PLATE

     `Section 3.mov` is 1180x2092 — 16:9 landscape written sideways,
     with no rotation flag to say so. Rotated back it is 2092x1180.

     It is also short: 100 unique frames over 2.82s, which is not
     enough to scrub without seeing individual frames. So it is
     retimed and motion-interpolated to 60fps, giving 210 frames over
     3.5s. Checked at 2x zoom on the moving parts — the camera drift
     is slow enough that nothing warps.

     Measured on the shipped plate:
       T 0.03        a cut: the whip-pan gives way to the room
       T 0.10-0.20   L 48 -> 12   the room falls into darkness
       T 0.20-0.27   L 12         the darkest frames
       T 0.27-1.10   L 12 -> 50   the light arriving, in surges
       T 1.10-3.50   L 50 -> 56   established; a slow push-in
     ------------------------------------------------------------ */
  var PLATE_END = 3.50;
  var LEAD_IN  = 0.060;
  var LEAD_OUT = 0.900;

  var PLATES = {
    wide:     { ar: 2092 / 1180, hi: 1500, lo: 'sunrise-desktop.mp4', hiSrc: 'sunrise-desktop-2x.mp4' },
    portrait: { ar: 1080 / 2160, hi: 900,  lo: 'sunrise-mobile.mp4',  hiSrc: 'sunrise-mobile-2x.mp4' }
  };

  /* Two thirds of this plate is a held frame. Spending two thirds of
     the runway on it would mean scrolling through nothing, so the map
     is ramped: still monotonic, still frame-accurate to the scrollbar,
     but slower through the part where the light is actually arriving.

     x^1.45 puts the halfway point of the scroll at T 1.30 — the moment
     the room finishes opening — instead of at T 1.75. */
  var GAMMA = 1.45;
  function curve(x) { return Math.pow(x, GAMMA); }

  /* The exact inverse, so a moment in the footage can be written as
     the second it happens at and land on the right scroll position
     even if the ramp is ever retuned. */
  function qAt(t) {
    return LEAD_IN + Math.pow(clamp01(t / PLATE_END), 1 / GAMMA) * (LEAD_OUT - LEAD_IN);
  }

  /* ------------------------------------------------------------
     THE BEATS THE PETALS ARE CUT TO

     The brief asks for the bursts to land on the exact frames her
     foot meets the ground. They do not exist. The whole take is 100
     frames of her standing in a shaft of light with one hand in her
     hair: measured against a control patch at the same distance from
     frame centre — so the push-in cancels — her body moves 0.2-0.5
     units from T 1.28 to the last frame, which is grain. She never
     takes a step, and the source is 2.82s against the plate's 3.50s,
     so there is no walk trimmed off either end to go back for.

     What the plate does have is the same beat somewhere better. The
     light lands on the floor where she is standing, and it does not
     arrive smoothly — it arrives in surges. Sampling only the pool
     at her feet (x 18-53%, y 75-100%):

       T 0.33   L  14 ->  29    the first warmth reaches the floor
       T 0.40   L  29 ->  54    it lands — the largest jump in the plate
       T 0.53   L  54 ->  73
       T 0.67   L  73 ->  97    the second largest
       T 0.80   L  97 -> 111
       T 0.93   L 111 -> 124
       T 1.03   L 124 -> 129    the peak, and it holds from here

     So the signature is intact and it is honest: the petals are
     thrown up from the ground at her feet on the frames the light
     strikes it, and the size of each burst is the size of that
     frame's jump. Read on a scroll it is indistinguishable from what
     was asked for — bursts from the ground where she stands, on a
     real beat in the footage — and it is cut to something that is
     actually in the picture.

     x/y are her feet in frame percent, tracked because the camera
     pushes in: read off the plate at T 0.42/0.62/0.82/1.02, where her
     lit trousers are the brightest vertical run in the frame
     (L 130-150 at x 30-37%).
     ------------------------------------------------------------ */
  var STEP = [
    /*  T      x%     y%    share  power  ring */
    [0.33,  31.0,  69.0,  0.075,  0.55,   0],
    [0.40,  31.2,  70.5,  0.160,  0.85,  16],
    [0.53,  31.6,  72.5,  0.117,  0.70,   0],
    [0.67,  32.0,  75.5,  0.170,  0.92,  18],
    [0.80,  32.4,  78.5,  0.128,  0.72,   0],
    [0.93,  32.8,  81.0,  0.138,  0.78,   0],
    [1.03,  33.0,  83.0,  0.212,  1.00,  22]
  ];

  /* ------------------------------------------------------------
     THE BEAM

     Both ends of the shaft move, because the camera pushes in for
     the whole plate — and not evenly, so a single eased ramp misses
     it by up to eight points of frame width. These are measured
     instead: per frame, the brightest column of the upper band (the
     curtain, L 142 against a room at L 55) and of the floor band
     (the pool). The push is quick while the light is still arriving
     and settles to a crawl after.

     One table drives the CSS shafts, the bloom, the floor lift and
     the canvas, so nothing can drift off the light it belongs to.

     Her feet are at x 31-33% and the pool's centre at 44-46%: she is
     standing at the near edge of it, which is why a burst starts at
     the dim edge of the beam and brightens as it rises into it.
     ------------------------------------------------------------ */
  var SHAFT = [
    /*   q     curtain  pool   beam width */
    [0.232,  60.0,  44.0,  17.0],
    [0.350,  67.0,  45.0,  18.5],
    [0.450,  75.0,  44.0,  20.5],
    [0.621,  78.0,  46.0,  22.5],
    [0.735,  80.0,  46.0,  24.0],
    [0.807,  81.0,  50.0,  25.0],
    [0.900,  83.0,  52.0,  26.0]
  ];

  function shaftAt(q) {
    var a = SHAFT[0], b, i, t;
    if (q <= a[0]) return { tx: a[1], bx: a[2], w: a[3] };
    for (i = 1; i < SHAFT.length; i++) {
      b = SHAFT[i];
      if (q <= b[0]) {
        t = (q - a[0]) / (b[0] - a[0]);
        return { tx: a[1] + (b[1] - a[1]) * t,
                 bx: a[2] + (b[2] - a[2]) * t,
                 w:  a[3] + (b[3] - a[3]) * t };
      }
      a = b;
    }
    return { tx: a[1], bx: a[2], w: a[3] };
  }

  /* How much petal is on screen. Nothing before the light reaches
     the floor, building through the bursts, fullest across the held
     room, and gone before the release at 0.945 so the last frame
     plays clean. The build is what keeps hundreds of petals quiet:
     the count rises long before the brightness does. */
  function petalLevel(q) {
    var inn = ease(ramp(q, 0.196, 0.262));
    var out = 1 - ease(ramp(q, 0.858, 0.936));
    var build = 0.46 + 0.54 * ease(ramp(q, 0.240, 0.600));
    return inn * out * build;
  }

  /* ------------------------------------------------------------
     TIMELINE  (q = progress through the pinned section)

     With the ramp above, the plate's own events land at:
       q 0.15   T 0.15   the darkest frame
       q 0.21   T 0.30   the light starts
       q 0.25   T 0.40   it lands on the floor
       q 0.42   T 1.03   the pool peaks
       q 0.45   T 1.16   the room is open
       q 0.90   T 3.50   the last frame

     §14 asked for the scene to establish first, the light to build
     through the middle and the type to hold across the peak. That is
     what these are, placed against those numbers rather than spread
     evenly.
     ------------------------------------------------------------ */
  var BEAT = {
    /* on the darkness, before there is a room to respect */
    /* Gone before the room is readable. The plate reaches L 41 at
       T 0.45, which the ramp puts at q 0.264 — after that this line
       would be sitting on her legs instead of on darkness. */
    open:    [0.110, 0.158, 0.214, 0.264],

    /* revealed by the light, held across the peak */
    glow:    [0.430, 0.530, 0.845, 0.900],
    mainL1:  [0.430, 0.528, 0.848, 0.896],
    sub:     [0.560, 0.640, 0.842, 0.884],

    dust:    [0.380, 0.520, 0.858, 0.930]
  };

  /* ------------------------------------------------------------ */

  var sec = document.getElementById('sunrise');
  if (!sec) return;

  var video = document.getElementById('sunVideo');
  var el = {
    plate: document.getElementById('sunPlate'),
    cool:  document.getElementById('sunCool'),
    warm:  document.getElementById('sunWarm'),
    floor: document.getElementById('sunFloor'),
    haze:  document.getElementById('sunHaze'),
    beam:  document.getElementById('sunBeam'),
    bloom: document.getElementById('sunBloom'),
    edge:  document.getElementById('sunEdge'),
    dust:  document.getElementById('sunDust'),
    pet:   document.getElementById('sunPet'),
    open:  document.getElementById('sunOpen'),
    main:  document.getElementById('sunMain'),
    mainH: document.getElementById('sunMainH'),
    sub:   document.getElementById('sunSub')
  };

  var mainLines = [];
  var field = null;

  /* ------------------------------------------------------------
     THE PETAL FIELD

     Built on a composition change and nowhere else. The portrait
     plate is a different picture rather than a smaller one — the
     room is a full-width band inside its own blurred fill, measured
     at y 27.3%-53.7% of the frame — so the field is told where the
     band is and maps into it, and the bursts stay on her feet
     instead of landing somewhere in the blur.
     ------------------------------------------------------------ */
  function buildField(portrait) {
    if (!el.pet || !R.petals) return;

    var count = portrait ? 380 : 900;
    if (R.reduced) count = Math.round(count * 0.45);
    var budget = Math.round(count * 0.42);   /* the rest is the drift */

    var bursts = [];
    for (var i = 0; i < STEP.length; i++) {
      var s = STEP[i];
      bursts.push({
        q: qAt(s[0]),
        x: s[1],
        y: s[2],
        n: Math.max(4, Math.round(budget * s[3])),
        power: s[4],
        ring: s[5]
      });
    }

    field = R.petals({
      canvas: el.pet,
      /* the plate's intrinsic size and object-position, so a frame
         coordinate survives `object-fit: cover` on any window */
      plate: portrait
        ? { w: 1080, h: 2160, ox: 0.5, oy: 0.5 }
        : { w: 2092, h: 1180, ox: 0.5, oy: 0.56 },
      band: portrait ? { top: 0.273, height: 0.264 } : null,
      seed: 30820253,
      count: count,
      bursts: bursts,
      /* The drift. It starts as the room opens and thins out before
         the type leaves, and it is the half of the brief that asks
         for quantity without intensity — many, slow, and dim. */
      ambient: { from: 0.300, to: 0.800 },
      shaft: shaftAt,
      level: petalLevel,
      /* soft white, warm cream, pale pink. The golden highlights are
         not a fourth petal — they are what the beam does to these
         three when one crosses it. */
      tones: ['#fbf7f2', '#f7e9cf', '#f3d9d4']
    });
  }

  /* ------------------------------------------------------------
     THE AIR
     Dust, and nothing else — Scene 04 has the butterflies. Motes are
     placed where the light actually is, because that is the only
     place real dust shows: the shaft at lower-left and the window at
     upper-right.
     ------------------------------------------------------------ */
  function buildDust(portrait) {
    if (!el.dust) return;
    el.dust.textContent = '';

    var rnd = rng(30820251);
    var n = portrait ? 7 : 14;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < n; i++) {
      /* two thirds in the left shaft, the rest in the right window */
      var left = (i % 3) !== 2;
      var x = left ? pick(rnd, 2, 26) : pick(rnd, 74, 94);
      var y = left ? pick(rnd, 38, 88) : pick(rnd, 8, 52);

      var d = document.createElement('span');
      d.className = 'sun-dust';
      d.style.cssText =
        '--x:' + x.toFixed(1) + '%;' +
        '--y:' + y.toFixed(1) + '%;' +
        '--w:' + pick(rnd, 2.4, 6.5).toFixed(1) + 'px;' +
        '--op:' + pick(rnd, .34, .8).toFixed(2) + ';' +
        '--soft:' + pick(rnd, .4, 1.7).toFixed(1) + 'px;' +
        '--dx:' + pick(rnd, -2.6, 2.6).toFixed(1) + 'vw;' +
        '--dy:' + pick(rnd, -7, -1.8).toFixed(1) + 'vh;' +
        '--dur:' + pick(rnd, 7, 15).toFixed(1) + 's;' +
        '--delay:-' + pick(rnd, 0, 15).toFixed(1) + 's';
      frag.appendChild(d);
    }
    el.dust.appendChild(frag);
  }

  function rebuild(portrait) {
    buildDust(portrait);
    buildField(portrait);
  }

  function mountCopy() {
    R.util.mirrorLines(sec);
    mainLines = el.mainH ? el.mainH.querySelectorAll('.ln') : [];
  }

  /* ------------------------------------------------------------
     PAINT
     ------------------------------------------------------------ */
  function paint(q) {
    /* --- the light ---------------------------------------------- */

    /* Scene 02 dissolves to black and this opens out of it. */
    var enter = ease(ramp(q, 0, 0.095));
    put(el.plate, '--senter', enter);

    /* Cool and closed-down while the plate is at its darkest, gone by
       the time the room has opened. */
    put(el.cool, '--scool', 1 - ease(ramp(q, 0.150, 0.430)));

    /* The warmth builds across the middle, holds through the peak and
       is eased back rather than switched off — §06 asks for the light
       to settle, not to stop. */
    var warm = trap(q, [0.250, 0.620, 0.860, 0.985]);
    put(el.warm, '--swarm', Math.max(warm, 0.30 * ease(ramp(q, 0.34, 0.52))));

    /* The haze and the shafts arrive after the warmth, so the air
       lights up rather than the whole frame turning. */
    put(el.haze, '--shaze', trap(q, [0.400, 0.660, 0.850, 0.960]) * 0.9);

    /* The three layers that track the light's own geometry. The
       floor lift comes up with the first surge, the shafts once
       there is enough haze for them to hang in, the bloom last —
       a lens only blooms on something already blown out. */
    var sh = shaftAt(q);
    put(el.beam,  '--sx', sh.tx);
    put(el.bloom, '--sx', sh.tx);
    put(el.floor, '--bx', sh.bx);

    put(el.floor, '--sfloor', trap(q, [0.205, 0.420, 0.860, 0.950]));
    put(el.beam,  '--sbeam',  trap(q, [0.300, 0.520, 0.860, 0.950]));
    put(el.bloom, '--sbloom', trap(q, [0.340, 0.560, 0.870, 0.955]));

    /* --- the air ------------------------------------------------ */
    put(el.dust, '--mo', trap(q, BEAT.dust));

    /* The petals. Drawn on the same frame as the seek, from the same
       q, so the field and the film can never disagree — and stopped
       by the same loop, because there is nothing here to keep
       running once the scroll settles. */
    if (field) field.draw(q);

    /* --- the type ----------------------------------------------- */
    put(el.open, '--mt', trap(q, BEAT.open));
    put(el.main, '--mt', trap(q, BEAT.glow));
    if (mainLines[0]) put(mainLines[0], '--mt', trap(q, BEAT.mainL1));
    put(el.sub,  '--mt', trap(q, BEAT.sub));

    /* §16: hold the last frame clean, then release. The type is gone
       by 0.900, the dust by 0.930 and the petals by 0.936, so nothing
       is dissolved out mid-sentence. */
    put(el.edge, '--sedge', ease(ramp(q, 0.945, 1)));

    sec.classList.toggle('sun--in', enter > 0.999);
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
      curve:     curve,
      plates:    PLATES,
      paint:     paint,
      rebuild:   rebuild,
      outClass:  'sun--out',
      liveClass: 'sun-live'
    });

    /* scrub only rebuilds on a change of *composition*; the canvas
       also has to follow a plain resize, which changes its backing
       store and the cover mapping but not which plate is playing.
       `load` is in the list because the field is built at boot and a
       canvas measured before its frame has height would keep a 1x1
       mapping until something happened to resize the window.
       resize() is a no-op when nothing has actually changed. */
    function refit() { if (field) field.resize(); }
    window.addEventListener('resize', refit, { passive: true });
    window.addEventListener('orientationchange', refit, { passive: true });
    window.addEventListener('load', refit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
