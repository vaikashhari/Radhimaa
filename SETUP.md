# Radhimaa — setup and deploy

Everything you need to run this, change it, or put it online. No build
step, no package manager, no dependencies — it is HTML, CSS and JS that
a browser reads directly.

---

## 1. Get it

```bash
git clone https://github.com/gireeshkumarreddy/radhimaa.git
cd radhimaa
```

## 2. Run it

It **must** be served over HTTP — opening `index.html` from the file
system will not work, because the browser refuses Range requests on
`file://` and the whole film is scroll-scrubbed video.

```bash
node tools/dev-server.mjs . 8123
```

Then open <http://localhost:8123>.

Any static server that supports HTTP Range works. `npx serve` and
`php -S localhost:8123` are both fine. **`python -m http.server` is
not** — it does not serve Range requests, so the video will refuse to
scrub.

## 3. What is in here

```
index.html                 the whole page — all six chapters and the ending
tools/dev-server.mjs       the local server (Range-capable)

assets/css/                one stylesheet per chapter
assets/js/                 one script per chapter, plus five shared modules
assets/video/              22 encoded plates — four tiers per chapter
assets/img/                the Radhimaa wordmark

README.md                  why every number in here is the number it is
```

The five shared modules are the interesting part:

| file | what it is |
|---|---|
| `scrub.js` | the scroll transport every chapter after the hero shares |
| `petals.js` | Scene 03's petal field |
| `wings.js` | Scene 04's butterflies, petals and motes |
| `lumen.js` | Scene 05's lights |
| `bloom.js` | Scene 06's flowers |

## 4. What is *not* in here

The six raw camera masters (`Hero video.mov`, `Section 2 video.MP4`,
`Section 3–6.mov`) are **not committed**. They are 75MB of unreleased
footage, this repository is public, and the site does not need them —
they were only the input to the encodes in `assets/video/`, which are
committed and are what the site actually plays.

Keep them backed up somewhere private. If you ever need to regenerate a
plate, the exact ffmpeg recipe for each one is documented in the header
comment of that chapter's JS file and in `README.md`.

## 5. Changing the words

All copy lives in two places and nowhere else:

- **Chapter lines** — in `index.html`, inside each `<section>`. Edit the
  text between `<span class="ln__in">…</span>`. Nothing else needs to
  change; the reveal animation reads the string out of the markup.
- **Everything else** — the hero tagline, the nav, the social rail, and
  the whole ending — is in the `CONTENT` object at the top of
  `assets/js/hero.js`.

## 6. Before you launch — the links

Nine links currently have a label but no destination. They render and
read correctly but cannot be clicked, and each is marked in the DOM with
`data-pending` so they are easy to find.

```bash
grep -n "href: ''" assets/js/hero.js
```

That will list all nine: the footer's Spotify / YouTube / Instagram, the
hero's About / Music / Story / Gallery nav, and the hero's Instagram /
Facebook / YouTube rail. Fill in the `href` for each and the
`data-pending` attribute stops being applied.

The closing line and the copyright are in the same `CONTENT.ending`
object.

## 7. Putting it online

The site is fully static, so anything that serves files will host it.

### GitHub Pages

1. Push to `main` (already done).
2. On GitHub: **Settings → Pages**.
3. Under *Build and deployment*, set **Source** to `Deploy from a branch`.
4. Set the branch to `main` and the folder to `/ (root)`. Save.
5. Wait a minute or two; the URL appears at the top of that page —
   `https://gireeshkumarreddy.github.io/radhimaa/`.

One caveat worth knowing: the plates are ~85MB in total and GitHub Pages
has a soft bandwidth limit of 100GB per month. That is roughly a
thousand full visits. If the song does well, move to a host with a CDN.

### Netlify / Vercel / Cloudflare Pages

Connect the repository and deploy. There is **no build command** and the
**publish directory is the repository root**. Leave both at their
defaults or set them explicitly to nothing and `/`.

These are the better option for a video-heavy site — all three put the
plates behind a CDN, which is what makes the scrubbing feel the same on
a phone in another country as it does on your machine.

## 8. If you re-encode anything

Two rules, both of which the whole film depends on:

1. **Every frame must be a keyframe.** The plates are all-intra
   (`-g 1 -keyint_min 1 -sc_threshold 0`). That is what makes a seek
   cost one frame of decode instead of a whole GOP, and it is the only
   reason scrubbing is smooth at all.
2. **The duration and frame count must not change.** Every chapter's
   beats are cut to specific timestamps in its plate, measured frame by
   frame. A plate that is even a few frames longer or shorter silently
   slides every animation in that chapter out of sync with the picture.

`README.md` records the retime factor, trim point and frame count for
each plate.
