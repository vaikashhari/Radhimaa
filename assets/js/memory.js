/* ============================================================
   RADHIMAA — SCENE 02 · THE MEMORY
   Scroll is the transport. Nothing here plays on a clock except
   the wingbeat of two butterflies and the grain.

   The plate is 12.16s long and every frame of it is a keyframe,
   so a seek costs one frame of decode instead of a GOP. That is
   the whole reason scrubbing this is smooth; see README.
   ============================================================ */
(function () {
  'use strict';

  /* ------------------------------------------------------------
     The copy is in index.html, not here — without JS this section
     still has to read. It was written to the footage rather than to
     a template: the plate cuts crowd -> embrace -> light leak -> the
     two of them on the sea wall. The centrepiece is on that last shot
     rather than on the embrace: the embrace is the warmest footage but
     it is a tight two-shot with nowhere to put words, while the sea
     wall has the largest quiet area in the film sitting directly above
     them. Three short moments in twelve seconds, and nothing else.
     ------------------------------------------------------------ */

  /* ------------------------------------------------------------
     THE PLATE

     Measured off the file, shot by shot — a per-frame mean-RGB and
     luminance pass over all 305 frames:

       0.00 - 2.05   the crowd        L 52,  warm +39   dark amber
       2.05 - 7.60   the embrace      L 62,  warm +43   gold, petals falling
       7.60 - 9.20   the light leak   L 189 at 8.60     blown out, from frame-left
       9.20 - 12.16  the sea wall     L 118 -> 182      pale mint, cooling then warming

     The file is cut at 12.16 on purpose: the camera whips off the
     couple in the last three frames of the original, and the frame
     before that — the two of them close, looking at each other — is
     the one worth holding on.
     ------------------------------------------------------------ */
  var PLATE_END = 12.16;

  /* ------------------------------------------------------------
     TIMELINE  (q = progress through the pinned section, 0 -> 1)

     Transport
       0.000 - 0.060   held on frame one while the memory surfaces
       0.060 - 0.900   scroll runs the film, linear
       0.900 - 1.000   held on the last frame, then dissolved

     Which puts the plate's own cuts at:
       the crowd       q 0.060 - 0.202
       the embrace     q 0.202 - 0.585
       the light leak  q 0.585 - 0.695
       the sea wall    q 0.695 - 0.900

     Every beat below is [fade in from, full by, hold until, gone by].
     They are placed against those cuts, not spread evenly: the main
     text is sharp across the warmest 9% of the scroll and is taken
     by the leak rather than fading on its own.
     ------------------------------------------------------------ */
  var LEAD_IN  = 0.060;
  var LEAD_OUT = 0.900;

  var BEAT = {
    eyebrow:  [0.072, 0.112, 0.188, 0.232],

    /* the quiet line, over the embrace — taken by the leak */
    aside:    [0.300, 0.372, 0.545, 0.600],

    /* the centrepiece, over the two of them on the sea wall */
    mainGlow: [0.712, 0.798, 0.862, 0.905],
    mainL1:   [0.712, 0.795, 0.864, 0.902],
    mainL2:   [0.734, 0.815, 0.864, 0.906],
    mainSub:  [0.792, 0.848, 0.860, 0.894],

    petals:   [0.232, 0.328, 0.572, 0.658],
    dust:     [0.278, 0.388, 0.598, 0.698],
    blossoms: [0.352, 0.438, 0.582, 0.648],
    heart:    [0.452, 0.490, 0.518, 0.558],
    fly1:     [0.298, 0.362, 0.518, 0.582],
    fly2:     [0.718, 0.778, 0.868, 0.918],

    bloom:    [0.582, 0.658, 0.672, 0.758]
  };

  var JOURNEY = {
    fly1: [0.282, 0.598],
    fly2: [0.700, 0.938]
  };


  /* How hard the picture chases the scrollbar. Low enough that a wheel
     notch reads as a move rather than a jump, high enough that letting
     go stops the film inside ~150ms. Under reduced motion it is 1: the
     film tracks the scrollbar exactly, with no easing of its own, since
     easing is the one part of this that moves on its own. */

  /* ------------------------------------------------------------ */

  var R = window.Radhimaa;
  var clamp01 = R.util.clamp01, ramp = R.util.ramp, ease = R.util.ease,
      trap = R.util.trap, put = R.util.put, rng = R.util.rng, pick = R.util.pick;

  /* The two encodes are different compositions, not two sizes of one
     picture — the portrait plate carries its own blurred surround. The
     2x pair is the source's true maximum: the picture inside the
     supplied file is 2160x1260, and 2160 is the widest real pixel in
     it. See README. */
  var PLATES = {
    wide:     { ar: 2160 / 1260, hi: 1500, lo: 'memory-desktop.mp4', hiSrc: 'memory-desktop-2x.mp4' },
    portrait: { ar: 1080 / 2160, hi: 900,  lo: 'memory-mobile.mp4',  hiSrc: 'memory-mobile-2x.mp4' }
  };

  var sec   = document.getElementById('memory');
  if (!sec) return;

  var video = document.getElementById('memVideo');
  var el = {
    plate:    document.getElementById('memPlate'),
    cool:     document.getElementById('memCool'),
    warm:     document.getElementById('memWarm'),
    bloom:    document.getElementById('memBloom'),
    edge:     document.getElementById('memEdge'),
    petals:   document.getElementById('airPetals'),
    dust:     document.getElementById('airDust'),
    blossoms: document.getElementById('airBlossoms'),
    heart:    document.getElementById('airHeart'),
    fly1:     document.getElementById('memFly1'),
    fly2:     document.getElementById('memFly2'),
    eyebrow:  document.getElementById('memEyebrow'),
    main:     document.getElementById('memMain'),
    mainH:    document.getElementById('memMainH'),
    sub:      document.getElementById('memSub'),
    aside:    document.getElementById('memAside')
  };

  /* ------------------------------------------------------------
     helpers
     ------------------------------------------------------------ */


  /* smoothstep — arrivals and departures should not have corners */

  /* [in from, full by, hold until, gone by] */

  /* Custom-property writes are style invalidations. Most of these
     values sit pinned at 0 or 1 for long stretches of the scroll,
     so the cheapest write is the one that doesn't happen. */

  /* deterministic, so the air is identical on every load —
     same generator as the hero's waveform */


  /* ------------------------------------------------------------
     COPY
     Every line reveals twice: a blurred ghost of itself in ::before
     is the "soft blur, then a glow" half, and a radial mask opening
     outward from the middle of .ln__in is the "letters emerging from
     the centre" half. The ghost needs the string in a property, so
     it is mirrored out of the markup here — the text is still only
     written once, in index.html.
     ------------------------------------------------------------ */
  var mainLines = [];

  function mountCopy() {
    R.util.mirrorLines(sec);
    mainLines = el.mainH ? el.mainH.querySelectorAll('.ln') : [];
  }

  /* ------------------------------------------------------------
     THE AIR

     Counts are deliberately small. The plate already has petals
     falling through the embrace; these extend that fall past the
     edges of frame rather than starting a second weather system.

     Positions come off the 24x14 activity map — nothing is placed
     where a face is, and nothing bright is placed on his shirt.
     ------------------------------------------------------------ */
  var PETAL_C = [
    ['rgba(224,185,143,.95)', 'rgba(180,118,73,.42)'],
    ['rgba(211,171,123,.92)', 'rgba(138,82,48,.40)'],
    ['rgba(201,143,99,.90)',  'rgba(138,82,48,.34)']
  ];

  /* [count, w, h, opacity, blur, fall seconds] per depth */
  var PETAL_DEPTH = [
    [3, 7,  5,  .32, 0,   15, 19],
    [3, 13, 9,  .42, 1.1, 11, 14],
    [1, 27, 18, .24, 4.2, 8,  10]
  ];

  function buildPetals(portrait) {
    if (!el.petals) return;
    var rnd = rng(20260825);
    var frag = document.createDocumentFragment();

    PETAL_DEPTH.forEach(function (d, di) {
      var n = portrait ? Math.max(1, d[0] - 1) : d[0];
      for (var i = 0; i < n; i++) {
        var p = document.createElement('span');
        p.className = 'petal';
        var c = PETAL_C[(di + i) % PETAL_C.length];
        var s = pick(rnd, .82, 1.2);

        p.style.cssText =
          '--x:' + pick(rnd, 4, 92).toFixed(1) + '%;' +
          '--y:0;' +
          '--w:' + (d[1] * s).toFixed(1) + 'px;' +
          '--h:' + (d[2] * s).toFixed(1) + 'px;' +
          '--op:' + d[3] + ';' +
          '--soft:' + d[4] + 'px;' +
          '--c1:' + c[0] + ';' +
          '--c2:' + c[1] + ';' +
          '--drift:' + pick(rnd, -13, 9).toFixed(1) + 'vw;' +
          '--dur:' + pick(rnd, d[5], d[6]).toFixed(1) + 's;' +
          '--sway:' + pick(rnd, 2.6, 4.6).toFixed(2) + 's;' +
          '--delay:-' + pick(rnd, 0, d[6]).toFixed(1) + 's';

        var inner = document.createElement('i');
        inner.className = 'petal__i';
        p.appendChild(inner);
        frag.appendChild(p);
      }
    });

    el.petals.appendChild(frag);
  }

  /* Motes live in the light: a few in the lamp glow above her head
     (x 26-42%, y 4-16% of the embrace), the rest out at the edges
     where the frame is dark and still. */
  function buildDust(portrait) {
    if (!el.dust) return;
    var rnd = rng(778104);
    var n = portrait ? 5 : 10;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < n; i++) {
      var inGlow = (i % 3 === 0);
      var x = inGlow ? pick(rnd, 26, 44) : (rnd() < .5 ? pick(rnd, 3, 27) : pick(rnd, 63, 96));
      var y = inGlow ? pick(rnd, 4, 20) : pick(rnd, 8, 90);

      var d = document.createElement('span');
      d.className = 'dust';
      d.style.cssText =
        '--x:' + x.toFixed(1) + '%;' +
        '--y:' + y.toFixed(1) + '%;' +
        '--w:' + pick(rnd, 3, 7.5).toFixed(1) + 'px;' +
        '--op:' + pick(rnd, .3, .72).toFixed(2) + ';' +
        '--soft:' + pick(rnd, .5, 2).toFixed(1) + 'px;' +
        '--dx:' + pick(rnd, -3.4, 3.4).toFixed(1) + 'vw;' +
        '--dy:' + pick(rnd, -6, -1.4).toFixed(1) + 'vh;' +
        '--dur:' + pick(rnd, 6, 13).toFixed(1) + 's;' +
        '--delay:-' + pick(rnd, 0, 13).toFixed(1) + 's';
      frag.appendChild(d);
    }
    el.dust.appendChild(frag);
  }

  /* She is wearing jasmine. Three loose ones, in the quietest cells
     of the frame: against her dark hair, and out in the blurred
     background to the right.

     They are built out of soft radial falloff rather than filled
     shapes, and sized large enough that blurring them still leaves a
     hint of petal. A small crisp five-petal flower is a sticker; a
     larger defocused one is a blossom the lens didn't catch. */
  var BLOSSOM = {
    wide:     [[9, 17, 52], [87, 8, 42], [91, 31, 34]],
    portrait: [[12, 13, 46], [86, 70, 38]]
  };

  var SVGNS = 'http://www.w3.org/2000/svg';

  function gradStop(off, col) {
    var s = document.createElementNS(SVGNS, 'stop');
    s.setAttribute('offset', off);
    s.setAttribute('stop-color', col);
    return s;
  }

  function blossomSvg(i) {
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.setAttribute('aria-hidden', 'true');

    var defs = document.createElementNS(SVGNS, 'defs');
    var pid = 'memPetal' + i, cid = 'memEye' + i;

    var pg = document.createElementNS(SVGNS, 'radialGradient');
    pg.setAttribute('id', pid);
    pg.setAttribute('cx', '50%'); pg.setAttribute('cy', '62%'); pg.setAttribute('r', '66%');
    pg.appendChild(gradStop('0%',   'rgba(255,253,247,.96)'));
    pg.appendChild(gradStop('58%',  'rgba(255,247,232,.84)'));
    pg.appendChild(gradStop('100%', 'rgba(252,230,196,0)'));
    defs.appendChild(pg);

    var cg = document.createElementNS(SVGNS, 'radialGradient');
    cg.setAttribute('id', cid);
    cg.appendChild(gradStop('0%',   'rgba(255,226,158,.85)'));
    cg.appendChild(gradStop('100%', 'rgba(254,209,101,0)'));
    defs.appendChild(cg);
    svg.appendChild(defs);

    /* petals overlap toward the middle, so the flower reads as one
       soft mass rather than five separated blades */
    for (var k = 0; k < 5; k++) {
      var pet = document.createElementNS(SVGNS, 'ellipse');
      pet.setAttribute('cx', '20'); pet.setAttribute('cy', '13.2');
      pet.setAttribute('rx', '7.4'); pet.setAttribute('ry', '9.2');
      pet.setAttribute('fill', 'url(#' + pid + ')');
      pet.setAttribute('transform', 'rotate(' + (k * 72 + i * 17) + ' 20 20)');
      svg.appendChild(pet);
    }

    var eye = document.createElementNS(SVGNS, 'circle');
    eye.setAttribute('cx', '20'); eye.setAttribute('cy', '20'); eye.setAttribute('r', '6');
    eye.setAttribute('fill', 'url(#' + cid + ')');
    svg.appendChild(eye);

    return svg;
  }

  function buildBlossoms(portrait) {
    if (!el.blossoms) return;
    var rnd = rng(41207);
    var list = portrait ? BLOSSOM.portrait : BLOSSOM.wide;
    var frag = document.createDocumentFragment();

    list.forEach(function (b, i) {
      var w = document.createElement('span');
      w.className = 'bloom';
      w.style.cssText =
        '--x:' + b[0] + '%;' +
        '--y:' + b[1] + '%;' +
        '--w:' + b[2] + 'px;' +
        '--op:' + pick(rnd, .34, .48).toFixed(2) + ';' +
        '--soft:' + (b[2] * pick(rnd, .044, .062)).toFixed(2) + 'px;' +
        '--dur:' + pick(rnd, 9, 15).toFixed(1) + 's;' +
        '--delay:-' + (i * 3.1).toFixed(1) + 's';

      w.appendChild(blossomSvg(i));
      frag.appendChild(w);
    });

    el.blossoms.appendChild(frag);
  }

  /* Flight paths. X is linear in --mk, Y is quadratic, so the crossing
     arcs instead of sliding.

     The first one is deliberately kept in the top tenth of the frame.
     A straighter, lower crossing put it over his cheekbone at q 0.42,
     where a pale shape stops reading as something passing in front and
     starts reading as something stuck on. Up here it crosses the lamp
     glow above her head and then his hair, which is dark, and never
     touches either face. The second rises out of the sea into the open
     sky, well to the right of the two of them at every moment of the
     push-in — and it is a dark shape, because nothing pale survives on
     a sky that measures L 215. */
  var FLIGHT = {
    wide: {
      fly1: { x: '96%', y: '15%', w: '40px', dx: '-100vw', dy: '-10vh', arc: '-4vh' },
      fly2: { x: '70%', y: '70%', w: '32px', dx: '12vw',   dy: '-60vh', arc: '4vh'  }
    },
    portrait: {
      fly1: { x: '92%', y: '30%', w: '38px', dx: '-96vw', dy: '-6vh',  arc: '-3vh' },
      fly2: { x: '62%', y: '56%', w: '28px', dx: '10vw',  dy: '-44vh', arc: '3vh'  }
    }
  };

  function placeFlights(portrait) {
    var set = portrait ? FLIGHT.portrait : FLIGHT.wide;
    [['fly1', el.fly1], ['fly2', el.fly2]].forEach(function (pair) {
      var f = set[pair[0]], node = pair[1];
      if (!node) return;
      node.style.setProperty('--x', f.x);
      node.style.setProperty('--y', f.y);
      node.style.setProperty('--w', f.w);
      node.style.setProperty('--dx', f.dx);
      node.style.setProperty('--dy', f.dy);
      node.style.setProperty('--arc', f.arc);
    });

    if (el.heart) {
      el.heart.style.left = portrait ? '22%' : '76%';
      el.heart.style.top  = portrait ? '72%' : '30%';
    }
  }


  /* scrub.js owns the did-the-composition-change guard and hands the
     answer in, so this only ever runs when it actually needs to. */
  function buildAir(portrait) {
    [el.petals, el.dust, el.blossoms].forEach(function (host) {
      if (host) host.textContent = '';
    });

    buildPetals(portrait);
    buildDust(portrait);
    buildBlossoms(portrait);
    placeFlights(portrait);
  }

  /* ------------------------------------------------------------
     PAINT
     One pass. Every value below is derived from the same eased q
     the picture is on, so the type and the air can never drift out
     of step with the frame they belong to.
     ------------------------------------------------------------ */
  function paint(q) {
    /* --- the grade --------------------------------------------- */
    var enter = ease(ramp(q, 0, 0.105));
    put(el.plate, '--menter', enter);

    /* The hero hands over on black and its blue air hangs about for
       a moment before the room warms up. §17. */
    put(el.cool, '--mcool', 1 - ease(ramp(q, 0.062, 0.262)));

    /* Warmth swells across the embrace and is then pulled back out
       through the leak. The leak is the loudest thing in the film on
       its own — measured, the plate goes to L 189 and clips a fifth of
       its subpixels there — so the grade gets out of its way rather
       than piling on. It settles to a floor afterwards instead of
       going out: the sea wall is bathed, not graded back to zero. */
    var warm = trap(q, [0.198, 0.498, 0.572, 0.742]);
    put(el.warm, '--mwarm', Math.max(warm, 0.22 * ease(ramp(q, 0.30, 0.48))));

    put(el.bloom, '--mbloom', trap(q, BEAT.bloom) * 0.8);

    /* §18: the last frame is held long enough to be looked at — the text
       has gone by 0.906 and the butterfly by 0.918, so the frame is held
       clean for the last 4.5% before anything happens to it. */
    put(el.edge, '--medge', ease(ramp(q, 0.950, 1)));

    /* --- the air ----------------------------------------------- */
    put(el.petals,   '--mo', trap(q, BEAT.petals));
    put(el.dust,     '--mo', trap(q, BEAT.dust));
    put(el.blossoms, '--mo', trap(q, BEAT.blossoms));
    put(el.heart,    '--mo', trap(q, BEAT.heart) * 0.62);

    put(el.fly1, '--mo', trap(q, BEAT.fly1) * 0.44);
    put(el.fly2, '--mo', trap(q, BEAT.fly2) * 0.78);
    put(el.fly1, '--mk', ease(ramp(q, JOURNEY.fly1[0], JOURNEY.fly1[1])));
    put(el.fly2, '--mk', ease(ramp(q, JOURNEY.fly2[0], JOURNEY.fly2[1])));

    /* --- the type ---------------------------------------------- */
    put(el.eyebrow, '--mt', trap(q, BEAT.eyebrow));
    put(el.main,    '--mt', trap(q, BEAT.mainGlow));
    if (mainLines[0]) put(mainLines[0], '--mt', trap(q, BEAT.mainL1));
    if (mainLines[1]) put(mainLines[1], '--mt', trap(q, BEAT.mainL2));
    put(el.sub,     '--mt', trap(q, BEAT.mainSub));

    put(el.aside, '--mt', trap(q, BEAT.aside));

    sec.classList.toggle('mem--in', enter > 0.999);
  }

  /* ------------------------------------------------------------
     TRANSPORT
     The pin, the chase, the seek discipline, the plate tiering and
     the lifecycle all live in scrub.js — every chapter after Scene 01
     works the same way and there should be one place where that is
     correct. This file supplies only what is particular to the
     memory: its beats, its air and its paint pass.
     ------------------------------------------------------------ */
  function boot() {
    mountCopy();

    R.scrub({
      section:  sec,
      video:    video,
      plateEnd: PLATE_END,
      leadIn:   LEAD_IN,
      leadOut:  LEAD_OUT,
      plates:   PLATES,
      paint:    paint,
      rebuild:  buildAir,
      outClass: 'mem--out',
      /* nothing floats over the frame while it is on screen —
         see .mem-live in memory.css */
      liveClass: 'mem-live'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
