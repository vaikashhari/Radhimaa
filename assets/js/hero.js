/* ============================================================
   RADHIMAA — cinematic sequence controller
   Scene 01 (the fall), the interface layer, the caption scenes,
   the ending.

   The film drives the timing. The hero plate carries a lightning
   strike at 3.996s of its own runtime; see TIMELINE before changing
   any number here.
   ============================================================ */
(function () {
  'use strict';

  /* ------------------------------------------------------------
     CONTENT
     Copy marked "from the reference" was read off the reference
     composition supplied for this build. Everything still blank is
     waiting on you — empty renders nothing at all, with no
     placeholder and no reserved gap.
     ------------------------------------------------------------ */
  var CONTENT = {

    // from the reference
    heroCaption: 'A STORY THAT ECHOES.',
    railText:    'EVERY MELODY HAS A MEMORY.',
    scrollLabel: 'SCROLL TO EXPLORE',

    // from the reference. `href` is pending: an item with no destination
    // still reads but cannot be clicked, so nothing here can ship as a
    // link to nowhere. Grep data-pending before launch.
    nav: [
      { label: 'About',   href: '' },
      { label: 'Music',   href: '' },
      { label: 'Story',   href: '' },
      { label: 'Gallery', href: '' }
    ],

    // right-hand rail. `kind` selects the mark: instagram | facebook | youtube
    social: [
      { kind: 'instagram', label: 'Instagram', href: '' },
      { kind: 'facebook',  label: 'Facebook',  href: '' },
      { kind: 'youtube',   label: 'YouTube',   href: '' }
    ],

    // what the play control plays. With no `src` it unmutes the film's
    // own audio track; point it at the song and it drives that instead,
    // leaving the plate silent.
    audio: { src: '', loop: true },

    // the menu — falls back to the nav on a phone, where the inline
    // navigation is hidden.
    menu: [],

    // the breakup captions, in order. Each entry is one cinematic
    // moment; each string is one line, revealed on its own beat.
    //   captions: [ { lines: ['first line', 'second line'] } ]
    captions: [],

    // The last page of the film. `line` is the closing sentence;
    // `links` are §17's three destinations — hrefs are pending, so
    // each reads but cannot be clicked until a real URL is dropped
    // in. Grep data-pending before launch.
    ending: {
      line: 'And it still plays, every time I let it.',
      links: [
        { label: 'Spotify',   href: '', external: true },
        { label: 'YouTube',   href: '', external: true },
        { label: 'Instagram', href: '', external: true }
      ],
      note: '© 2026 Radhimaa  ·  All rights reserved'
    }
  };

  /* ------------------------------------------------------------
     TIMELINE  (milliseconds from t0)

     t0 = the moment the plate actually starts playing, which is gated
     on the video being decodable. Holding the darkness until then keeps
     the sequence identical on every connection instead of drifting.

     Add 1000ms to read these as seconds from page load:

       0.0 – 1.0s   pure black
       1.0 – 3.0s   the film emerges from darkness
       3.0 – 5.0s   the fall, alone — no typography yet
       5.0 – 7.0s   the title resolves
       7.1s         the tagline
       7.9s         header + side rails
       8.7s         the bottom controls

     The play disc, its waveform and the platform buttons used to occupy
     8.7s, 9.4s and 10.0s. They are gone — Scene 01 is an opening title,
     not a player — and the bottom controls were pulled up into the beat
     the disc had vacated rather than left arriving 1.3s after the last
     thing the reader can see.

     On `title`: the strike runs 3.996–4.138s of plate time. The reveal
     opens on it while the lettering is still near-invisible, so the
     flash announces the title without ever being the frame it has to
     compete against — by the time it carries weight the plate is dark
     again and it measures ~5.9:1. Visibility first.
     ------------------------------------------------------------ */
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var T = REDUCED
    ? { hold: 220,  settle: 400,  title: 620,  titleSettle: 1120,
        caption: 860,  hdr: 980,  foot: 1120, done: 1500 }
    : { hold: 1000, settle: 3300, title: 4000, titleSettle: 6000,
        caption: 6100, hdr: 6900, foot: 7700, done: 2600 };

  var LOAD_TIMEOUT = 6000;   // never hold the darkness longer than this

  /* ------------------------------------------------------------ */

  var body  = document.body;
  var root  = document.documentElement;
  var video = document.getElementById('heroVideo');
  var stage = document.getElementById('stage');
  var hero  = document.getElementById('hero');

  /* the only elements that read --p / --mx / --my */
  var pTargets = [], mTargets = [];
  function collectTargets() {
    pTargets = [$('parallax'), $('type'), document.querySelector('.hero__veil'), $('ui')]
      .filter(Boolean);
    mTargets = [$('parallax'), $('typeInner')].filter(Boolean);
  }

  var timers = [];
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function $(id) { return document.getElementById(id); }
  function text(el, s) { if (el && s) el.textContent = s; }


  /* ------------------------------------------------------------
     ICONS
     ------------------------------------------------------------ */
  var SVGNS = 'http://www.w3.org/2000/svg';

  var MARKS = {
    instagram: { box: '0 0 24 24', stroke: true, dot: [17.1, 6.9, 1], d: [
      'M7.6 3.5h8.8a4.1 4.1 0 0 1 4.1 4.1v8.8a4.1 4.1 0 0 1-4.1 4.1H7.6a4.1 4.1 0 0 1-4.1-4.1V7.6a4.1 4.1 0 0 1 4.1-4.1z',
      'M12 7.9a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2z'
    ] },
    facebook: { box: '0 0 24 24', d: [
      'M13.3 21v-8h2.6l.4-3h-3V8c0-.87.25-1.46 1.5-1.46h1.6V3.85A21 21 0 0 0 14.06 3.7c-2.3 0-3.9 1.4-3.9 3.98V10H7.6v3h2.56v8z'
    ] },
    youtube: { box: '0 0 24 24', d: [
      'M21.6 7.3s-.2-1.4-.8-2c-.75-.8-1.6-.8-2-.85C16 4.3 12 4.3 12 4.3s-4 0-6.8.15c-.4.05-1.25.05-2 .85-.6.6-.8 2-.8 2S2.2 8.9 2.2 10.5v1.4c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.75.8 1.73.77 2.17.86C6.9 18.1 12 18.15 12 18.15s4 0 6.8-.16c.4-.05 1.25-.05 2-.85.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.4c0-1.6-.2-3.2-.2-3.2zM9.9 13.9V8.6l5.15 2.66z'
    ] }
  };

  function markSvg(kind) {
    var m = MARKS[kind];
    if (!m) return null;
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', m.box);
    svg.setAttribute('aria-hidden', 'true');
    if (m.stroke) {
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.6');
      svg.setAttribute('stroke-linejoin', 'round');
    } else {
      svg.setAttribute('fill', 'currentColor');
    }
    m.d.forEach(function (d) {
      var p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    if (m.dot) {
      var c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', m.dot[0]); c.setAttribute('cy', m.dot[1]); c.setAttribute('r', m.dot[2]);
      c.setAttribute('fill', 'currentColor'); c.setAttribute('stroke', 'none');
      svg.appendChild(c);
    }
    return svg;
  }


  /* ------------------------------------------------------------
     BUILDING THE INTERFACE
     ------------------------------------------------------------ */
  function anchor(item, cls) {
    var a = document.createElement('a');
    if (cls) a.className = cls;
    if (item.href) {
      a.href = item.href;
      if (item.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    } else {
      a.setAttribute('data-pending', '');   // grep before launch
    }
    return a;
  }

  function buildNav() {
    var host = $('nav');
    if (!host || !CONTENT.nav) return;
    CONTENT.nav.forEach(function (item) {
      if (!item || !item.label) return;
      var a = anchor(item);
      a.textContent = item.label;
      host.appendChild(a);
    });
  }

  function buildSocial() {
    var host = $('railR');
    if (!host || !CONTENT.social) return;
    CONTENT.social.forEach(function (item, i) {
      if (!item || !MARKS[item.kind]) return;
      if (i) {
        var sep = document.createElement('span');
        sep.className = 'rail__sep';
        sep.setAttribute('aria-hidden', 'true');
        host.appendChild(sep);
      }
      var a = anchor(item);
      a.setAttribute('aria-label', item.label || item.kind);
      if (item.href) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.appendChild(markSvg(item.kind));
      host.appendChild(a);
    });
  }


  /* ------------------------------------------------------------
     SOUND
     One state, three controls: the play disc and both bottom
     indicators. The film keeps running either way — freezing the
     plate would kill the scene.
     ------------------------------------------------------------ */
  function initSound() {
    var btn = $('play');
    var label = $('soundLabel');
    var controls = [btn, $('soundL'), $('soundR')].filter(Boolean);
    if (!controls.length) return;

    var track = null;
    var src = ((CONTENT.audio && CONTENT.audio.src) || '').trim();
    if (src) {
      track = new Audio(src);
      track.loop = !(CONTENT.audio && CONTENT.audio.loop === false);
      track.preload = 'none';
    }

    var on = false;

    function paint() {
      body.classList.toggle('is-playing', on);
      if (btn) {
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-label', on ? 'Pause the theme' : 'Play the theme');
      }
      if (label) label.textContent = on ? 'SOUND ON' : 'SOUND OFF';
    }

    function set(next) {
      on = next;
      if (track) {
        if (on) {
          var p = track.play();
          if (p && p.catch) p.catch(function () { on = false; paint(); });
        } else { track.pause(); }
      } else if (video) {
        video.muted = !on;
        if (on && video.paused) {
          var q = video.play();
          if (q && q.catch) q.catch(function () {});
        }
      }
      paint();
    }

    controls.forEach(function (el) {
      el.addEventListener('click', function () { set(!on); });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && on) set(false);
    });

    paint();
  }

  /* ------------------------------------------------------------
     MENU
     On a phone the inline nav is hidden, so the menu carries it.
     ------------------------------------------------------------ */
  function initMenu() {
    var btn = $('menuBtn');
    var panel = $('menuPanel');
    if (!btn || !panel) return;

    var items = (CONTENT.menu && CONTENT.menu.length) ? CONTENT.menu : CONTENT.nav;
    if (!items || !items.length) { btn.hidden = true; return; }

    items.forEach(function (item) {
      if (!item || !item.label) return;
      var a = anchor(item);
      a.textContent = item.label;
      panel.appendChild(a);
    });

    panel.hidden = false;
    var open = false;

    function set(next) {
      open = next;
      panel.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    set(false);

    btn.addEventListener('click', function (e) { e.stopPropagation(); set(!open); });
    document.addEventListener('click', function (e) {
      if (open && !panel.contains(e.target) && !btn.contains(e.target)) set(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { set(false); btn.focus(); }
    });
  }

  /* ------------------------------------------------------------
     Copy injection
     ------------------------------------------------------------ */
  function mountContent() {
    var cap = (CONTENT.heroCaption || '').trim();
    var capEl = $('heroCaption');
    if (cap && capEl) { capEl.textContent = cap; capEl.hidden = false; }

    text($('railText'), (CONTENT.railText || '').trim());
    text($('scrollLabel'), (CONTENT.scrollLabel || '').trim());

    buildNav();
    buildSocial();

    var endLinks = $('endingLinks');
    if (endLinks && CONTENT.ending && CONTENT.ending.links) {
      CONTENT.ending.links.forEach(function (item) {
        if (!item || !item.label) return;
        var a = anchor(item);
        a.textContent = item.label;
        endLinks.appendChild(a);
      });
    }
    text($('endingLine'), ((CONTENT.ending && CONTENT.ending.line) || '').trim());
    text($('endingNote'), ((CONTENT.ending && CONTENT.ending.note) || '').trim());

    mountCaptions();
  }

  /* Each caption is its own scene: a tall block with a sticky frame, so
     the reader's scroll — not a timer — paces the reveal and the hold. */
  function mountCaptions() {
    var host = $('captions');
    var list = CONTENT.captions;
    if (!host || !list || !list.length) return;

    list.forEach(function (entry) {
      var lines = Array.isArray(entry) ? entry : (entry && entry.lines) || [];
      lines = lines.filter(function (l) { return typeof l === 'string' && l.length; });
      if (!lines.length) return;

      var scene = document.createElement('section');
      scene.className = 'scene';
      scene.setAttribute('data-scene', '');

      var inner = document.createElement('div');
      inner.className = 'scene__inner';

      var block = document.createElement('div');
      lines.forEach(function (line, i) {
        var p = document.createElement('p');
        p.className = 'scene__line';
        p.style.setProperty('--d', String(i));
        p.textContent = line;          // exact wording and punctuation
        block.appendChild(p);
      });

      inner.appendChild(block);
      scene.appendChild(inner);
      host.appendChild(scene);
    });
  }

  /* ------------------------------------------------------------
     Boot gate — darkness until the plate can actually play
     ------------------------------------------------------------ */
  function videoReady() {
    return new Promise(function (resolve) {
      if (!video || video.readyState >= 3) return resolve();

      var events = ['canplay', 'canplaythrough', 'loadeddata', 'error'];
      var settled = false;

      function done() {
        if (settled) return;
        settled = true;
        events.forEach(function (e) { video.removeEventListener(e, done); });
        resolve();
      }

      events.forEach(function (e) { video.addEventListener(e, done); });
      setTimeout(done, LOAD_TIMEOUT);
    });
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* Reveal a group, with a small stagger inside it so the parts arrive
     rather than switch on together. */
  function reveal(nodes, step) {
    nodes.forEach(function (el, i) {
      if (!el) return;
      if (step) el.style.transitionDelay = (i * step) + 'ms';
      el.classList.add('is-in');
    });
  }

  /* ------------------------------------------------------------
     The opening sequence
     ------------------------------------------------------------ */
  function open() {
    if (video) {
      try { video.currentTime = 0; } catch (e) {}
      var played = video.play();
      // If autoplay is refused the poster stays up and the rest of the
      // sequence still runs — the scene degrades, it does not break.
      if (played && played.catch) played.catch(function () {});
    }

    body.classList.remove('is-booting');
    body.classList.add('is-revealed');

    at(T.settle,      function () { body.classList.add('is-settled'); });
    at(T.title,       function () { body.classList.add('is-lit'); });
    at(T.titleSettle, function () { body.classList.add('is-settled-title'); });

    at(T.caption, function () { reveal([$('heroCaption')]); });
    at(T.hdr,     function () { reveal([$('logo'), $('nav'), $('menuBtn'), $('railL'), $('railR')], 130); });
    at(T.foot,    function () { reveal([$('soundL'), $('scrollCue'), $('soundR')], 150); });

    at(T.done, function () { body.classList.add('is-done'); });
  }

  /* ------------------------------------------------------------
     Pointer depth
     A few pixels of scene drift, less on the typography, less again
     on the interface. The loop stops itself once it has caught up.
     ------------------------------------------------------------ */
  function initPointer() {
    if (REDUCED) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, frame = null;

    function tick() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      var sx = cx.toFixed(4), sy2 = cy.toFixed(4);
      for (var k = 0; k < mTargets.length; k++) {
        mTargets[k].style.setProperty('--mx', sx);
        mTargets[k].style.setProperty('--my', sy2);
      }

      if (Math.abs(tx - cx) > 0.0008 || Math.abs(ty - cy) > 0.0008) {
        frame = requestAnimationFrame(tick);
      } else { frame = null; }
    }

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = clamp((e.clientX / window.innerWidth  - 0.5) * 2, -1, 1);
      ty = clamp((e.clientY / window.innerHeight - 0.5) * 2, -1, 1);
      if (!frame) frame = requestAnimationFrame(tick);
    }, { passive: true });

    window.addEventListener('pointerleave', function () {
      tx = 0; ty = 0;
      if (!frame) frame = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* ------------------------------------------------------------
     Scroll
     One pass per frame writes --p for the hero and --q for whichever
     scenes are on screen. Geometry is measured once and on resize,
     never per frame, so scrolling never forces a layout.
     ------------------------------------------------------------ */
  function initScroll() {
    var frame = null;
    var metrics = [];

    function measure() {
      var sy = window.scrollY;
      metrics = Array.prototype.map.call(
        document.querySelectorAll('[data-scene]'),
        function (el) {
          var r = el.getBoundingClientRect();
          return { el: el, top: r.top + sy, h: r.height };
        }
      );
    }

    function apply() {
      frame = null;
      var vh = window.innerHeight;
      var sy = window.scrollY;

      if (stage) {
        var range = stage.offsetHeight - vh;
        var p = range > 0 ? clamp((sy - stage.offsetTop) / range, 0, 1) : 0;
        var pv = p.toFixed(4);
        for (var k = 0; k < pTargets.length; k++) {
          pTargets[k].style.setProperty('--p', pv);
        }
      }

      for (var i = 0; i < metrics.length; i++) {
        var m = metrics[i];
        if (sy + vh < m.top || sy > m.top + m.h) continue;   // off screen, skip
        var r2 = m.h - vh;
        var q = r2 > 0 ? clamp((sy - m.top) / r2, 0, 1) : 0;
        m.el.style.setProperty('--q', q.toFixed(4));
      }
    }

    function onScroll() { if (!frame) frame = requestAnimationFrame(apply); }
    function resized() { measure(); onScroll(); }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resized, { passive: true });
    window.addEventListener('orientationchange', resized, { passive: true });

    measure();
    apply();
    window.addEventListener('load', resized);
  }

  /* ------------------------------------------------------------
     Don't decode frames nobody is looking at
     ------------------------------------------------------------ */
  function initVisibility() {
    if (!video) return;
    var offscreen = false;

    function resume() {
      if (offscreen || document.hidden) return;
      if (video.paused && body.classList.contains('is-revealed')) {
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      }
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        offscreen = !entries[0].isIntersecting;
        if (offscreen) video.pause();
        else resume();
      }, { threshold: 0.01 }).observe(hero);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) video.pause();
      else resume();
    });
  }

  /* ------------------------------------------------------------ */
  function boot() {
    // A cinematic opening starts at the top, even on a refresh. The reset
    // has to be instant — the page sets scroll-behavior: smooth for the
    // logo and the scroll cue, which would otherwise animate this in view.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prev;

    collectTargets();
    mountContent();
    initSound();
    initMenu();
    initPointer();
    initScroll();
    initVisibility();

    Promise.all([videoReady(), wait(T.hold)]).then(open);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
