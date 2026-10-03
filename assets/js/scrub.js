/* ============================================================
   RADHIMAA — the scroll transport

   Every cinematic chapter after Scene 01 works the same way: a
   full-screen plate pinned to the viewport, with the scrollbar as
   its transport. Forwards runs the film, backwards rewinds it,
   stopping stops it. Only the timeline and the atmosphere differ.

   That machinery lives here rather than in each chapter, so there
   is one place where the seek discipline, the plate tiering and
   the lifecycle are correct. A chapter supplies its own beats, its
   own decorations and its own paint pass.

   Load order matters: this file is a plain script and must come
   before the chapters that use it. All of them are `defer`, so
   markup order is execution order.
   ============================================================ */
(function () {
  'use strict';

  var R = (window.Radhimaa = window.Radhimaa || {});

  /* ------------------------------------------------------------
     Shared maths. Every chapter shapes its beats with these.
     ------------------------------------------------------------ */
  var util = R.util = {

    clamp01: function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; },

    ramp: function (q, a, b) {
      return b === a ? (q < a ? 0 : 1) : util.clamp01((q - a) / (b - a));
    },

    /* smoothstep — arrivals and departures should not have corners */
    ease: function (x) { return x * x * (3 - 2 * x); },

    /* [fade in from, full by, hold until, gone by] */
    trap: function (q, b) {
      if (q <= b[0] || q >= b[3]) return 0;
      if (q < b[1]) return util.ease(util.ramp(q, b[0], b[1]));
      if (q <= b[2]) return 1;
      return 1 - util.ease(util.ramp(q, b[2], b[3]));
    },

    /* Custom-property writes are style invalidations. Most of these
       values sit pinned at 0 or 1 for long stretches of a scroll, so
       the cheapest write is the one that doesn't happen. */
    put: function (node, name, v) {
      if (!node) return;
      var s = v.toFixed(4);
      var key = '_' + name;
      if (node[key] === s) return;
      node[key] = s;
      node.style.setProperty(name, s);
    },

    /* deterministic, so a chapter's atmosphere is identical on every
       load — the same generator as Scene 01's waveform used */
    rng: function (seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    },

    pick: function (rnd, a, b) { return a + (b - a) * rnd(); },

    /* The butterfly.

       Scene 02 introduced it and Scene 04 brings it back, so the
       shape lives here and both should read as the same creature.
       Wings closing to 0.62 rather than a third, because a third of
       its width reads as a bowtie for most of a crossing — which is
       most of what a reader ever sees of it.

       (Scene 02 predates this and still carries its own inline copy
       in index.html; switch it over next time that markup is opened.)

       The caller wraps it: .fly gets --mk and the horizontal travel,
       .fly__y the quadratic vertical, .fly__b the wingbeat. */
    butterfly: function () {
      var NS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'fly__svg');
      svg.setAttribute('viewBox', '0 0 60 44');
      svg.setAttribute('aria-hidden', 'true');

      [['M30 21C27 9 17 2 9 4 2 6 2 15 8 19c6 4 16 4 22 2Z',
        'M30 23c-4 6-12 15-19 13-6-2-6-9 0-12 6-3 15-3 19-1Z'],
       ['M30 21c3-12 13-19 21-17 7 2 7 11 1 15-6 4-16 4-22 2Z',
        'M30 23c4 6 12 15 19 13 6-2 6-9 0-12-6-3-15-3-19-1Z']
      ].forEach(function (pair) {
        var g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'fly__w');
        pair.forEach(function (d) {
          var p = document.createElementNS(NS, 'path');
          p.setAttribute('d', d);
          g.appendChild(p);
        });
        svg.appendChild(g);
      });

      var body = document.createElementNS(NS, 'ellipse');
      body.setAttribute('class', 'fly__body');
      body.setAttribute('cx', '30'); body.setAttribute('cy', '22');
      body.setAttribute('rx', '1.6'); body.setAttribute('ry', '8');
      svg.appendChild(body);
      return svg;
    },

    /* Each line of a chapter's copy is revealed twice — a blurred
       ghost of itself in ::before and a radial mask opening from its
       own centre. The ghost needs the string in a property, so it is
       mirrored out of the markup; the text is still written once. */
    mirrorLines: function (root) {
      var all = root.querySelectorAll('.ln');
      for (var i = 0; i < all.length; i++) {
        all[i].setAttribute('data-line', all[i].textContent.trim());
      }
      return all;
    }
  };

  var REDUCED = R.reduced =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------
     scrub(opts)

       section   the scroll runway (the tall element)
       video     the plate
       plates    { wide: {ar, hi, lo, hiSrc}, portrait: {…} }
       plateEnd  seconds of picture to scrub through
       leadIn    q at which the plate starts moving
       leadOut   q at which it reaches its last frame
       paint(q)  called every frame with the eased progress
       rebuild(isPortrait)  called when the composition changes
       inClass / outClass / liveClass  optional class hooks
     ------------------------------------------------------------ */
  R.scrub = function (opts) {
    var sec = opts.section;
    var video = opts.video;
    if (!sec) return;

    var LEAD_IN  = opts.leadIn  != null ? opts.leadIn  : 0.06;
    var LEAD_OUT = opts.leadOut != null ? opts.leadOut : 0.90;
    var PLATE_END = opts.plateEnd;

    /* How hard the picture chases the scrollbar. Low enough that a
       wheel notch reads as a move rather than a jump, high enough that
       letting go stops the film inside ~150ms. Under reduced motion it
       is 1: the film tracks the scrollbar exactly, with no easing of
       its own, since easing is the one part of this that moves on its
       own. */
    var CHASE = REDUCED ? 1 : (opts.chase || 0.19);
    var SETTLED = 0.00012;
    var SEEK_EPS = opts.seekEps || 0.012;

    var PORTRAIT = window.matchMedia('(max-aspect-ratio: 1/1)');

    var top = 0, range = 1;
    var qTarget = 0, qNow = -1;
    var frame = null, near = false;
    var seekPending = false, lastWant = -1;
    var asked = false, primed = false, swapPending = false;
    var builtPortrait = null;

    /* ---------------------------------------------------------- */

    function measure() {
      var r = sec.getBoundingClientRect();
      top = r.top + window.scrollY;
      range = Math.max(1, sec.offsetHeight - window.innerHeight);
    }

    function read() {
      qTarget = util.clamp01((window.scrollY - top) / range);
    }

    /* The film.

       Queuing a seek on top of one already in flight is how scrubbing
       turns to mud, so an in-flight seek is skipped — but skipping the
       *last* one silently leaves the picture on the wrong frame, since
       the loop is about to settle and never look again. That is what
       `seekPending` is for: it keeps the loop alive exactly long enough
       to land, and no longer.

       The comparison is against what was last asked for rather than
       against currentTime. A browser is free to report the timestamp of
       the frame it landed on, which can sit most of a frame away from
       the request — comparing against that would re-seek to the same
       frame forever. */
    function drive(q) {
      if (!video || video.readyState < 2) return;
      var pp = util.clamp01(util.ramp(q, LEAD_IN, LEAD_OUT));
      /* An optional speed ramp. Scroll still maps monotonically onto the
         picture — it is not a jump cut — but a plate whose last two
         thirds are a held frame should not spend two thirds of the
         runway on it. Omit `curve` and the map is linear, which is what
         a plate with even motion wants. */
      var want = PLATE_END * (opts.curve ? opts.curve(pp) : pp);
      if (video.seeking) { seekPending = true; return; }
      seekPending = false;
      if (Math.abs(want - lastWant) > SEEK_EPS) {
        lastWant = want;
        try { video.currentTime = want; } catch (e) {}
      }
    }

    function tick() {
      frame = null;
      var d = qTarget - qNow;
      if (Math.abs(d) < SETTLED) qNow = qTarget;
      else qNow += d * CHASE;

      opts.paint(qNow);
      drive(qNow);

      if (qNow !== qTarget || seekPending) frame = requestAnimationFrame(tick);
    }

    function kick() {
      if (!near) return;
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function onScroll() { read(); kick(); }

    function stop() {
      if (frame) { cancelAnimationFrame(frame); frame = null; }
    }

    /* ---------------------------------------------------------- */

    function fetchPlate() {
      if (asked || !video) return;
      asked = true;
      video.preload = 'auto';
      video.load();
    }

    function thrifty() {
      var c = navigator.connection;
      if (!c) return false;
      return !!c.saveData || /^(slow-)?2g$/.test(c.effectiveType || '');
    }

    /* Two axes.

       **Composition** is the stylesheet's — a portrait plate carries
       its own blurred surround baked in, so it is a different picture
       rather than a smaller one, and the file has to agree with the
       layout or a rotation leaves portrait bands under a landscape
       composition. That test is exactly `(max-aspect-ratio: 1/1)`.

       **Resolution** is the display's. A plate is drawn with
       `object-fit: cover`, so the width it is actually rasterised at is
       not the viewport width — on a viewport narrower in aspect than
       the plate, the height binds and the picture overflows sideways.
       Hence max(vw, vh × aspect), in device pixels. Below the
       threshold the extra pixels cannot be resolved and would only be
       bytes, so they are not sent. */
    function wantSrc() {
      var p = PORTRAIT.matches ? opts.plates.portrait : opts.plates.wide;
      var drawn = Math.max(window.innerWidth, window.innerHeight * p.ar) *
                  (window.devicePixelRatio || 1);
      var hi = drawn >= p.hi && !thrifty();
      return 'assets/video/' + (hi ? p.hiSrc : p.lo);
    }

    /* Swapping costs a re-download, so it only ever happens on a real
       change of composition or display, and never while the section is
       on screen. */
    function syncPlate() {
      if (!video) return;
      var want = wantSrc();
      if (video.getAttribute('src') === want) { swapPending = false; return; }
      if (near && video.readyState >= 2) { swapPending = true; return; }

      swapPending = false;
      primed = false;
      lastWant = -1;              /* a new file starts at frame one */
      video.setAttribute('src', want);
      if (asked) { video.preload = 'auto'; video.load(); }
    }

    /* Safari on iOS will not decode for seeking until the element has
       been played once. One muted frame, immediately paused. */
    function prime() {
      if (primed || !video) return;
      primed = true;
      var p = video.play();
      if (p && p.then) p.then(function () { video.pause(); }, function () {});
      else video.pause();
    }

    function rebuild() {
      var portrait = PORTRAIT.matches;
      if (builtPortrait === portrait) return;
      builtPortrait = portrait;
      if (opts.rebuild) opts.rebuild(portrait);
    }

    function reflow() { measure(); rebuild(); syncPlate(); read(); kick(); }

    function watch() {
      if (!('IntersectionObserver' in window)) {
        near = true; fetchPlate(); onScroll();
        return;
      }

      /* two screens out: start fetching */
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) fetchPlate();
      }, { rootMargin: '150% 0px' }).observe(sec);

      /* on screen: run the loop. Off screen: stop it, and hand the
         compositor hints back. */
      new IntersectionObserver(function (e) {
        near = e[0].isIntersecting;
        if (opts.outClass) sec.classList.toggle(opts.outClass, !near);
        if (opts.liveClass) document.body.classList.toggle(opts.liveClass, near);
        if (near) {
          measure(); read(); qNow = qTarget; opts.paint(qNow); drive(qNow); prime();
        } else {
          stop();
          if (swapPending) syncPlate();
        }
      }, { rootMargin: '15% 0px' }).observe(sec);
    }

    /* ---------------------------------------------------------- */

    rebuild();
    syncPlate();      /* chooses the file; preload="none" holds the fetch */

    if (video) {
      video.muted = true;
      video.pause();
      video.addEventListener('loadeddata', function () {
        read(); qNow = qTarget; opts.paint(qNow); drive(qNow);
      });
      /* nothing in a scrubbed chapter ever plays */
      video.addEventListener('play', function () {
        if (primed) video.pause();
      });
    }

    measure();
    read();
    qNow = qTarget;
    opts.paint(qNow);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', reflow, { passive: true });
    window.addEventListener('orientationchange', reflow, { passive: true });
    window.addEventListener('load', function () { fetchPlate(); reflow(); });
    if (PORTRAIT.addEventListener) PORTRAIT.addEventListener('change', reflow);

    watch();
  };
})();
