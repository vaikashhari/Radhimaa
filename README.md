# Radhimaa — cinematic site

Vanilla HTML/CSS/JS, no build step, no dependencies.

```bash
node tools/dev-server.mjs . 8123
```

Then open <http://localhost:8123>. (`python -m http.server` also works, but it does not
serve HTTP Range requests, which media wants — see *Production notes*.)

`SETUP.md` is the practical guide — cloning, running, changing the copy,
the nine links that still need destinations, and deploying. This file is
the other half: why every number in here is the number it is.

```
index.html
SETUP.md                 how to run, change and deploy it

assets/css/hero.css      Scene 01 — the scene, the interface layer, both compositions
assets/js/hero.js        Scene 01 — content, load gate, timeline, scene engine, sound
                                    and the ending
assets/js/scrub.js       the scroll transport every chapter after Scene 01 shares

assets/css/memory.css    Scene 02 — the frame, the grade, the air, the type
assets/js/memory.js      Scene 02 — its beats, its air, its paint pass
assets/css/sunrise.css   Scene 03 — the light, the petals, the type
assets/js/sunrise.js     Scene 03 — its beats, its light table, its paint pass
assets/js/petals.js        · the petal field
assets/css/sky.css       Scene 04 — the grade, the two canvases, the type
assets/js/sky.js         Scene 04 — its beats, its colour timeline, its paint pass
assets/js/wings.js         · butterflies, rose petals, motes
assets/css/rain.css      Scene 05 — the night, the two canvases, the type
assets/js/rain.js        Scene 05 — its beats, its light timeline, its paint pass
assets/js/lumen.js         · the lights that wake in the dark
assets/css/finale.css    Scene 06 — the grade, the two canvases, the type
assets/js/finale.js      Scene 06 — its beats, its build-up, its paint pass
assets/js/bloom.js         · the flower field

assets/video/            22 transcoded plates, four tiers per chapter (see below)
assets/img/              title artwork + P monogram, keyed to transparency
tools/dev-server.mjs     static server with Range support
```

The four field modules all follow the same rule and are worth reading in
order — `petals.js` states it, and each of the three after it inherits it
and records what its own chapter had to do differently. **Position is a
pure function of scroll**, so every field rewinds exactly; only the part
that has to breathe (a wingbeat, a flicker, a sway) carries a clock, and
that is switched off entirely under `prefers-reduced-motion`.

The **raw camera masters are not in this repository** — see `SETUP.md` §4.

One external request, added for Scene 02: **Cormorant Garamond** from Google Fonts. It is
the only display face in the building, it is loaded `display=swap`, and `--mem-serif` carries
a full fallback stack, so the section still sets if the request never lands.

---

## The interface

Built from the supplied reference composition, **measured rather than eyeballed** — colours
sampled from the image, positions and proportions taken as fractions of its frame and
re-expressed in viewport units.

| | sampled |
|---|---|
| logo / accents | `#f4c962` |
| rail text | `#d7ba7d` |
| navigation | `#e5e2e1` |
| secondary labels | `#cfc5b9` |
| social | `#beb7b3` |
| bottom controls | `#8a8785` |

The reference is 3:2; the plate is 16:9, so there is proportionally less height to work
with. Everything is anchored to hold anyway:

- **The title is anchored by its own centre**, not by the stack's:
  `top: calc(var(--title-y) - var(--title-w)/6.434)` puts the title's centre on `--title-y`
  at any width, and the tagline hangs beneath it.
- **The title is capped by height as well as width** — `min(54vw, 84vh, 960px)`. A vw-only
  title is enormous on a 1280×720 laptop and used to push the platform buttons straight
  through the bottom controls. Clearance verified at 1440×860 / 1280×720 / 1024×640 / 390×844.
- **The title sits where the frame is quietest.** A per-pixel busy map over all 148 loop
  frames (mean luminance + temporal activity) puts the calmest usable band at y 50–70%. It
  was pinned to 40% while a column of controls hung beneath it; with those gone it is 44%,
  which is inside that band and clears the figure's face in the frames where they are
  centred. See *Timeline*.

**Portrait is recomposed, not shrunk.** The inline nav moves into the menu, the left rail
steps aside, and the social rail drops to the lower right.

---

## The title

The supplied artwork is 3D metallic gold on pure black, keyed to transparency on a
**luminance matte** and used exactly as delivered — not recoloured, not redrawn, not
substituted with web type.

Legibility was measured: every frame captured twice, with the title and without, to isolate
the lettering against exactly what sits behind it.

| plate time | before | after |
|---|---|---|
| typical frames | 4.7–5.2:1 | **5.5–6.1:1** |
| **the lightning frame** | **2.46:1** | **3.68:1** |

Three things got it there: a wide soft scrim behind the wordmark (invisible on dark frames,
buys back separation on bright ones); a tight dark shadow hugging the letterforms instead of
glow; and size.

**The reveal deliberately opens on the lightning rather than landing on it.** The strike runs
3.996–4.138s of plate time. Igniting the title *inside* it looked spectacular and measured
terribly — 2.46:1, the worst contrast anywhere, at the exact moment the title was arriving.
The reveal now starts while the lettering is still near-invisible, so the flash announces it
and the title only carries weight once the plate is dark again. Opacity only ever climbs.

---

## What the supplied plate needed

`Hero video.mov` could not be used as-is:

| | Source | Shipped |
|---|---|---|
| Container / codec | `.mov`, HEVC | `.webm` (VP9) + `.mp4` (H.264) |
| Orientation | 1180×2100 **with a 90° rotation flag** | 2100×1180 baked in |
| Frame rate | variable (30/60 mixed) | constant 30 |
| Loop | ends dark, restarts bright | seamless (tail cross-dissolved into head) |
| Audio | stripped | restored, retimed and loop-matched |

Retimed to 0.82× — the one deliberate change to the footage. Audio was re-added with
`atempo` (pitch preserved) and its own cross-dissolve, so it loops at exactly 4.933s, the
same period as the picture.

**≈600 KB** first load on a modern desktop browser; the `.mp4`s exist only for Safari.

---

## Timeline

`t0` is the moment the plate actually starts playing, not page load — the darkness is held
until the video is decodable (floor 1000ms, ceiling 6000ms), so the sequence is identical on
a fast connection and a slow one. Add 1000ms to read these as seconds from load.

| | |
|---|---|
| 0.0 – 1.0s | pure black |
| 1.0 – 3.0s | the film emerges from darkness |
| 3.0 – 5.0s | the fall, alone — no typography |
| 5.0 – 7.0s | the title resolves |
| 7.1s | tagline |
| 7.9s | header + side rails |
| 8.7s | bottom controls |

The play disc, its waveform and the platform buttons used to occupy 8.7s, 9.4s and 10.0s.
With them gone the bottom controls were pulled up into the beat the disc had vacated rather
than left arriving 1.3s after the last thing there is to see.

**The title moved down with them.** It sat at 40% of the frame only because a column of
controls hung beneath it; the README's own busy map put the plate's calmest band at rows
46–68%. Re-running that map over the shipped loop agrees (activity 5–13 there against 15–22
at the edges), so `--title-y` is now **44%** in landscape and **50%** in portrait — which is
also what opens the space above it. Three numbers, one variable each; revert by putting 40%
and 34% back.

---

## Sound

One state, two controls — both bottom indicators drive it and both reflect it. (There were
three; the play disc in the centre of the frame was removed along with the waveform and the
two platform buttons, so that Scene 01 reads as an opening title rather than a player.
`initSound` already built its control list with `.filter(Boolean)`, so losing the disc cost
it nothing.) **The film keeps running either way**; freezing the plate would kill the scene,
so the control governs sound only.

With no `CONTENT.audio.src` it unmutes the film's own track. Point it at the song and it
drives that instead, leaving the plate silent:

```js
audio: { src: 'assets/audio/theme.mp3', loop: true }
```

---

## Scene 02 — the memory

A full-screen plate with the scrollbar as its transport. The section pins, scroll runs the
film, scrolling back rewinds it, stopping stops it. There is no container, no card and no
page background around it — the viewport **is** the film frame, and the typography, petals,
jasmine and two butterflies are lit by the same scene.

### What the supplied footage actually was

`Section 2 video.MP4` is a 2160×3840 HEVC file at 60fps, 58 MB — but it is **not a portrait
video**. Row-luminance profiling found the picture is a letterboxed band: pure black (value
0) for the top 1290 rows and the bottom 1290, with the real image occupying
**2160×1260 in the middle**, i.e. 12:7 (1.714:1), dead centre.

The four shots are not letterboxed identically. The sea-wall shot sits ~20px lower and ~26px
higher than the embrace, so the crop is taken to **its** box — `crop=2160:1260:0:1290` — and
the earlier shots give up 1.5% off the top and 2% off the bottom rather than the last shot
showing black bars on a tall window. Verified clean at seven points across the file.

**The file is trimmed to 12.16s.** The camera whips off the couple in the last three frames
of the original and lands on open water. The frame before that — the two of them close,
looking at each other — is the one worth holding on, so it is now the last frame in the file
and nothing has to be avoided at runtime.

| | Source | Shipped |
|---|---|---|
| Container / codec | `.mp4`, HEVC | `.mp4`, H.264 High |
| Frame | 2160×3840, picture letterboxed into the middle third | cropped to the picture |
| Frame rate | 60 | 25 |
| GOP | normal | **every frame a keyframe** |
| Audio | AAC | stripped |
| Length | 12.30s | 12.16s |

### Why every frame is a keyframe

Scrubbing works by assigning `video.currentTime`. On a normally-encoded file a seek has to
decode from the preceding keyframe, which is what makes most scroll-video sites feel like
mud. All-intra makes a seek cost one frame of decode. That costs size, so every size below
was tuned against a lossless reference rather than guessed.

### How much resolution actually exists

**There is no 4K in the supplied file.** Its 3840 dimension is the black letterbox; the
picture inside it is **2160×1260**, and 2160 is the widest real pixel it contains. Anything
above that is invention.

2160 is worth having, though, and SSIM alone said otherwise — a 1440→2160 round trip scores
0.9965, which reads as "no detail up there". Looking at 1:1 pixels says something else: the
roof tiles, railings and fishing-net rigging in the sea-wall shot are distinctly sharper at
2160. A contrast-independent edge-energy measure agrees, and unlike SSIM it separates them:

| | edge energy at t=4.0 / 6.5 / 10.4 |
|---|---|
| lossless 2160 master | 0.337 / 0.350 / 0.771 |
| **2160 @ CRF 30** | **0.327 / 0.335 / 0.651** |
| 1440 @ CRF 28 | 0.277 / 0.288 / 0.620 |

So the section ships at the source's true maximum, with a lower tier for displays that
cannot resolve it:

| | | size |
|---|---|---|
| `memory-desktop-2x.mp4` | 2160×1260, CRF 30 | 9.4 MB |
| `memory-desktop.mp4` | 1440×840, CRF 28 | 6.1 MB |
| `memory-mobile-2x.mp4` | 1080×2160, CRF 30 | 5.8 MB |
| `memory-mobile.mp4` | 720×1440, CRF 28 | 3.8 MB |

**Exactly one of these is ever fetched.** Composition is chosen by the stylesheet's own
`(max-aspect-ratio: 1/1)`; resolution is chosen by how wide the plate is actually rasterised,
which under `object-fit: cover` is `max(vw, vh × aspect) × devicePixelRatio` — not the
viewport width, because on a viewport narrower in aspect than the plate it is the height that
binds. A 1440-CSS-px laptop at 1× draws 1474 real pixels and gets the 1440 plate; the same
laptop at 2× draws 3367 and gets the 2160 one. `Save-Data` and 2G step down regardless.

None of it is loaded with the page. `preload="none"` holds the fetch until the reader is
within two screens of the section or the page has finished loading, whichever comes first, so
it never competes with the hero's arrival.

### The hero was left alone, and that is the right answer

The hero's source is 1180×2100 — it has no 4K in it either, and it already ships at 1920×1080,
91% of its own maximum. More to the point, **it carries no detail even at the width it
already uses**: round-tripping a shipped frame through 960 wide and back scores SSIM
0.9987–0.9992, and its edge energy (0.04–0.08) is an order of magnitude below Scene 02's.
It is a dark, motion-blurred, atmospheric plate and there is nothing up there to recover.

Re-encoding it would add bytes to a continuously-looping autoplay video for no visible gain,
and would mean rebuilding the 0.82× retime, the seamless tail-into-head cross-dissolve and
the loop-matched audio. It stays as it is.

### The shot map

Measured off the shipped file — mean RGB and luminance for all 305 frames:

| plate time | | mean L | R−B | |
|---|---|---|---|---|
| 0.00 – 2.05 | the crowd | 52 | +39 | dark amber, a courtyard full of people |
| 2.05 – 7.60 | the embrace | 62 | +43 | gold, rose petals falling, his smile |
| 7.60 – 9.20 | the light leak | **189** at 8.60 | +90 | blown out; enters frame-left, exits frame-right |
| 9.20 – 12.16 | the sea wall | 118 → 182 | +26 → +9 → +17 | pale mint, the two of them sitting |

Which puts the cuts, in scroll terms, at q 0.202 / 0.585 / 0.695. Every beat in
`memory.js` is placed against **those** numbers rather than spread evenly.

### Where the typography is allowed to go

A 24×14 grid of mean luminance **and** temporal activity was run over each shot. Nothing is
placed by eye.

- **The embrace.** The faces own the middle. The bottom-left quadrant measures L 15–45 at
  activity 2–14 — the darkest, stillest ground in the shot — so the one quiet line of this
  beat lives there, capped at 46vw so it stops short of his shirt (L 77–138 at cols 17+).
  Nothing larger fits without crossing a face, which is why the weight is not here.
- **The sea wall — the centrepiece.** The sky reads **L 203–220 at activity 0–2**: the
  largest, quietest area anywhere in the film, sitting directly above the two of them. The
  main love text is centred in it, and measured across the whole shot its box holds y 6–23%
  while their heads never rise above y 26% — a 3% margin at every frame of the push-in.
  It is set in **ink** (`--mem-ink`, #232a25) because nothing pale survives on that sky.
  That is the one place in the film where light type could not hold, and the footage is
  right about it.

Legibility was then measured the same way the hero's title was — every beat captured twice,
with the words and without, and the text colour composited against exactly what sits behind
it:

| | backdrop L | mean | worst cell |
|---|---|---|---|
| eyebrow *(crowd)* | 0.017 | 8.1:1 | 2.6:1 |
| quiet line *(embrace)* | 0.012 | 13.8:1 | 10.9:1 |
| **centrepiece line 1 (ink)** | 0.467 | 7.2:1 | 5.9:1 |
| **centrepiece line 2 (ink)** | 0.637 | 9.6:1 | 8.3:1 |
| supporting line *(ink)* | 0.755 | 6.1:1 | 6.0:1 |

Measured over the **glyph extents**, not the block boxes. The centrepiece is centred in a
full-width box whose ends reach into the dark trees on frame right; measuring that box
reported a 1.29:1 worst cell for the supporting line that no letter is anywhere near.

One weak cell is specific and known: the eyebrow's last three characters cross a figure in
white in the crowd (L 99). It is answered with a **tight shadow hugging the letterforms**
rather than a scrim on the film — the same conclusion Scene 01's title reached.

The eyebrow's is also transient. That figure walks through frame, so the same cell measures
3.4:1 at plate 0.9s, 2.7:1 at 1.6s and 4.8:1 at 2.3s, while the line's mean holds near 8:1
throughout. It is the smallest and least load-bearing text in the section and it is only on
screen across the crowd shot.

### The copy

Four short moments in twelve seconds, and nothing else. All of it is about **her**, and it is
written to what the footage actually shows rather than to a template — the plate cuts a
crowded courtyard, then the two of them alone in it, then the quiet by the water, so the
lines go the same way:

| | |
|---|---|
| over the crowd | *II — How I loved her* |
| over the embrace, one quiet line | *A room full of people, and only her.* |
| **over the two of them sitting together** | ***Loving her was mostly this —*** / ***sitting still, saying nothing.*** |
| under it, small | *We didn't know it was the best part* |

The centrepiece points at the picture it is sitting on: "mostly this" **is** the shot. The
italic falls on the second line because that is where it lands.

It lives in `index.html`, not in JS, so the section still reads with scripting off.

### The reveal

§04 asked for almost-invisible → soft blur → a small central glow → letters emerging → sharp.
It is done twice over, and neither half costs layout:

- a blurred ghost of the line in `::before`, at `--mt·(1−--mt)·2.7`, so it peaks halfway
  through and is gone by the time the line is sharp;
- a radial **mask** on the line itself, opening outward from its own centre — which is what
  makes the letters arrive from inside the frame rather than sliding in from an edge.

`letter-spacing` was the obvious way to do the same thing and is not used: animating it
forces layout on every frame of every reveal.

### Portrait is a different composition and a different file

A 9:16 crop of this footage **cannot hold two people in the embrace** — it keeps him and
loses her — so it is not attempted. The portrait plate is its own encode: the picture as a
full-width band, 720×540 inside 720×1440, with a blurred, slightly darkened copy of the same
frame filling above and below and a 46px feather across the seam. The surround is the
plate's own light, generated per frame, so it can never disagree with the colour of the shot
it belongs to — and it is where the portrait typography lives, so nothing is ever on top of
the picture.

The two encodes are different *compositions*, not two sizes of one picture, so the file has
to agree with which one the stylesheet is running. Both switch on nothing but
`(max-aspect-ratio: 1/1)`, and a real orientation change re-fetches — but only once the
section is off screen, never mid-scene.

The first pass baked `brightness=-0.15` into the fill and left a visible luminance step at
the seam on the bright sea shot. That is now `-0.07`, with the darkening that the type needs
moved into a CSS gradient that only touches the lower field.

### Colour

Sampled from the plate, not chosen: the leak's own edge lands on **#fed165**, within a hair
of Scene 01's `--gold`. That is why the two chapters agree without being matched.

`--mem-petal` #b47649 and #d3ab7b are the petals actually falling in shot — they are
terracotta and amber, not pink, which is why nothing here is pink. The sea sky is #d0eee2
and the water #949c85, both pale mint rather than blue.

Two blended layers do the whole grade. The hero hands over on black and its blue air hangs
around for a moment before the room warms (§17); warmth then swells across the embrace and is
**pulled back out through the leak**, because the plate goes to L 189 there on its own and
the grade's job at that moment is to get out of the way. It settles to a floor of 0.22
afterwards rather than going out — the sea wall is bathed, not graded back to zero.

### The air

Small on purpose, and every count is deliberate: **7 petals, 10 motes, 3 jasmine, 1 heart,
2 butterflies** on a wide screen; roughly half of that in portrait. Placement comes off the
same activity map as the type.

Three of these were built twice. The jasmine started as flat five-petal shapes with a gold
centre and read as stickers, so they are now soft radial falloff, larger, and blurred at
~5% of their own size — enough that a petal survives, not enough to draw a flower. The
butterfly's first crossing put it over his cheekbone at q 0.42, where a pale shape stops
reading as something passing in front and starts reading as something stuck on; it now stays
in the top tenth of the frame, through the lamp glow above her head and then his hair, and
never touches a face. Its wingbeat closes to 0.62 rather than 0.30 because a third of its
width reads as a bowtie for most of the crossing. The heart was two blurred lobes that never
met — two specks, not a symbol — and is now blurred as one composed shape.

Only the wingbeat and the grain run on a clock. Everything else is scroll.

### The ending

The plate reaches its last frame at q 0.900. The text is gone by 0.906 and the second
butterfly by 0.918, and only then — 0.950 — does the dissolve start. The last frame is
therefore held clean for the final 4.5% of the runway, roughly 30vh of scroll, before
anything happens to it.

## The scroll transport

Every chapter after Scene 01 works the same way — a full-screen plate pinned to the viewport
with the scrollbar as its transport — so that machinery lives in **`scrub.js`** rather than in
each chapter. One place where the seek discipline, the plate tiering and the lifecycle are
correct, and a chapter supplies only its own beats, decorations and paint pass.

It was extracted when Scene 03 arrived, at the moment it was cheapest: two consumers, one of
them being written fresh. Scene 02 was then re-run against its whole verification suite —
same plate tiering, same ±0.014s landing accuracy forwards and backwards, same overlay guard,
same layout at eight viewport sizes, no console errors — to prove the refactor cost it
nothing. `scrub.js` also holds the shared maths (`trap`, `ramp`, `ease`, `put`, the seeded
`rng`) that every chapter shapes its beats with.

One option is new: **`curve`**, a speed ramp on the scroll-to-picture map. Omit it and the map
is linear, which is what Scene 02 wants. Scene 03 needs it — see below.

---

## Scene 03 — the light

The chapter where the world fills with morning. Same transport, different film, and a
different job for the grade: this plate performs its own sunrise, so nothing here invents a
light source.

### What the supplied footage actually was

`Section 3.mov` is 1180×2092 — **16:9 landscape written sideways, with no rotation flag to
say so.** Rotated back (`transpose=2`) it is 2092×1180. Unlike Scene 02's plate it is not
letterboxed; the picture is the whole frame.

It is also **short**: 100 unique frames over 2.82s, about 35fps. Scrubbing that directly means
seeing individual frames. So it is retimed **1.75×** and motion-interpolated to 60fps, giving
**210 frames over 3.5s**. The interpolation was checked at 2× zoom on the moving parts before
it was trusted — the camera drift is slow enough that nothing warps.

The first **0.75s is a whip-pan** off the previous location. It is trimmed, so the chapter now
opens in the fall to darkness — which is what lets it join Scene 02, and it is the same
decision, for the same reason, as trimming Scene 02's whip-away tail.

### The sunrise is in the footage

Mean luminance across the shipped plate:

| | | |
|---|---|---|
| T 0.15–0.30 | **L 18** | the darkest point |
| T 0.30–1.20 | L 18 → 56 | the light arriving |
| T 1.20–3.50 | L 56 → 60 | the room established, near-static |

Warmth (R−B) climbs +12 → +27 across the same span. So the brief's *darkness → first light →
warmth* is something the plate already does; the grade's job is to lean on it, not to repaint
it.

**Measured at the emotional peak, the whole grade adds +6 luminance and +3 R−B** over the raw
plate. Early on it pulls the picture the other way — at T 0.57 the page reads L 35 / warm +15
against the plate's L 43 / warm +20, which is the cool, muted opening the brief asked for.
There is no sun and no flare, and the two warm glows sit exactly on the two windows that are
really there: the shaft at lower-left that falls across her, and the curtain at upper-right
that burns out to L 150.

### Two thirds of the plate is a held frame

Which is why this is the chapter that needed `curve`. A linear map would spend two thirds of
the runway on a still picture. `x^1.45` puts the halfway point of the scroll at T 1.30 — the
moment the room finishes opening — instead of at T 1.75. It is still monotonic and still
frame-accurate to the scrollbar; it is a speed ramp, not a cut. Verified landing within
0.015s of the intended frame at eight scroll positions, forwards and backwards.

### Where the typography goes

A 24×14 luminance-and-activity map over the whole window in which anything is on screen
(T 1.16 to the end) puts the band across the top of the wall, cols 4–17, at **L 10–46 and
activity 0–8** — the widest, darkest, stillest ground in the room. Both their heads stay below
y 16% through the camera's push-in, so the main line sits above them and never touches either.

**The opening line is not there.** While the plate is still at L 18 there is no room to
respect — only a small warm glow near the middle — so it sits low and centred, on black, and
is gone by q 0.264, which is where the plate reaches L 41 and the room becomes readable. Two
positions, each right for its own moment; they are never on screen together.

| | backdrop L | mean | worst cell |
|---|---|---|---|
| opening line | 0.002 | 17.0:1 | 15.4:1 |
| main line | 0.014 | 13.7:1 | 11.4:1 |
| supporting line | 0.014 | 10.1:1 | 7.9:1 |

Measured over the glyph extents. The best-measuring type in the building, because the room
gives it a genuinely dark, genuinely still wall to sit on.

### The air

Dust first: 14 motes on a wide screen, 7 in portrait, placed in the two shafts because that is
the only place real dust shows. Then, later, the petals — see below.

### She never takes a step

The brief for this update asked for the petal bursts to land on the exact frames the girl's
foot meets the ground, and called that the creative signature of the chapter. Those frames do
not exist, and it is worth writing down how that was established rather than asserted.

The first measurement looked promising: frame-to-frame difference in a box around her feet
showed six sharp, rhythmic spikes between T 0.28 and T 1.08 — exactly the cadence of walking.
They were an artefact. The room is coming out of darkness across that whole span, so *every*
pixel is changing; a control patch on the far wall spiked in step with them.

Rerun against a control at the same distance from frame centre — so the push-in cancels rather
than being mistaken for movement — the picture is unambiguous. From T 1.28 to the last frame
her net motion is 0.2–0.5 units, which is grain. She stands in the shaft with one hand in her
hair and holds the pose. Nor is there a walk trimmed off either end: the source is 2.82s and
the plate 3.50s, so the whole take is already on screen.

Saying so is the useful part of the job. Faking it would have meant scattering bursts on
plausible-looking beats and calling them footfalls.

### What the bursts are cut to instead

The plate has the same beat somewhere better. The light lands on the floor **where she is
standing**, and it does not arrive smoothly — it arrives in surges. Sampling only the pool at
her feet (x 18–53%, y 75–100%):

| T | pool luminance | |
|---|---|---|
| 0.33 | 14 → 29 | the first warmth reaches the floor |
| 0.40 | 29 → 54 | it lands — the largest jump in the plate |
| 0.53 | 54 → 73 | |
| 0.67 | 73 → 97 | the second largest |
| 0.80 | 97 → 111 | |
| 0.93 | 111 → 124 | |
| 1.03 | 124 → 129 | the peak, and it holds from here |

Seven bursts, thrown up from the ground at her feet, each sized to its own frame's jump — the
two largest get a ring on the floor as well. Read on a scroll it is what was asked for: petals
bursting from the ground where she stands, on a real beat in the footage. It is simply cut to
something that is actually in the picture.

Her feet are tracked rather than fixed, because the camera pushes in: x 31→33%, y 69→83% across
the burst window, read off the frames at T 0.42/0.62/0.82/1.02 where her lit trousers are the
brightest vertical run in the room (L 130–150 at x 30–37%).

### The petals are a function of scroll, not a simulation

`assets/js/petals.js`. 900 petals on a wide screen, 380 in portrait, one `<canvas>`, one pool
allocated at build time. Two decisions carry it.

**Nothing integrates and nothing reads a clock.** Each petal owns a birth point and a lifespan
measured in *q*, and its position is a closed-form curve evaluated at `u = (q − birth) / life`.
That is what makes the field reversible: a velocity-integrating system cannot rewind, because
rewinding needs the history it just threw away. Verified rather than assumed — the canvas is
byte-identical scrolled down to q 0.75, reversed back up to it, and on a fresh load, and
identical again after being held still for 1.2s. With the two pre-existing clock-driven layers
(film grain, drifting dust) frozen, the whole frame is identical in both directions too: 0 of
1,440,000 pixels differ.

**It is one node.** Hundreds of elements would be hundreds of style recalcs; this is one blit
per petal from sprites baked once. Each of three tones (soft white, warm cream, pale pink) is
baked at four brightness levels, and a petal picks the level its distance from the shaft's axis
earns it — so petals brighten as they cross the beam, at no draw-time cost. The golden
highlights the brief asked for are what the light does to those three tones, not a fourth kind
of petal.

Depth matters more than count. `rnd() * rnd()` biases the field far, so most petals are small
and crisp and a few are near the lens — much larger, softer for being scaled up from the same
sprite, dimmer for being out of focus, and falling faster. Without it the field is one size and
reads as confetti. Three in five enter over the top of the beam rather than across the full
width, because petals carried on the light should arrive with it.

The hot loop is written for the frame budget: one `setTransform` per petal instead of
`save`/`translate`/`rotate`/`scale`/`restore`, a rational falloff instead of `exp(−d²)` with the
distance left squared so there is no `sqrt` either, and no allocation anywhere — a full sweep of
the section makes no garbage. Measured against the same scene with all of it switched off:

| | median | p95 | frames over 20ms | script | style |
|---|---|---|---|---|---|
| everything on | 16.70ms | 16.90ms | **0 / 259** | 0.908ms | 1.882ms |
| none of it | 16.70ms | 16.90ms | 0 / 259 | 0.735ms | 1.504ms |

0.17ms of script and 0.38ms of style per frame, and not one dropped frame.

### The light was measured, not eyeballed

Both ends of the shaft move, because the camera pushes in for the whole plate — and not evenly,
so a single eased ramp missed it by up to eight points of frame width. They are measured per
frame instead, as the brightest column of the upper band (the curtain, L 142 against a room at
L 55) and of the floor band (the pool):

| q | curtain x | pool x |
|---|---|---|
| 0.232 | 60% | 44% |
| 0.450 | 75% | 44% |
| 0.735 | 80% | 46% |
| 0.900 | 83% | 52% |

One table drives the CSS shafts, the bloom, the floor lift and the canvas, so nothing can drift
off the light it belongs to. The shafts are a bundle of four, parallel because the sun is at
infinity and its rays through one window are, leaning 32° off vertical — the angle between the
curtain at the top of frame and the pool it throws on the floor. The bloom sits on the curtain
because at L 142 against L 55 it is the one thing in frame bright enough for a lens to bloom on,
and it carries one horizontal bleed, not a set of artifacts.

She stands at the *near edge* of the pool — her feet at x 31–33%, its centre at 44–46% — which
is why a burst starts at the dim edge of the beam and brightens as it rises into it.

### The joins

**In**: Scene 02 dissolves to black at its own `--medge`, holds black across the boundary, and
Scene 03 fades up from that same black. Measured at the join: `--medge` 1.0 / `--senter` 0 at
0px, 0.28 at +160px, 1.0 at +700px. No cut, no flash.

**Out**: the type is gone by q 0.900, the dust by 0.930 and the petals by 0.936, and only then
— 0.950 — does the dissolve start, so the last frame is held clean before anything happens to
it. Scene 04 has somewhere clean to begin.

### Portrait

The same problem as Scene 02 and the same answer: a 9:16 crop of a room with one person at
each side keeps neither of them, so the portrait plate is its own encode — the room as a
full-width band (1080×609) inside its own blurred light, landing at 27.3–53.7% of the height
(re-measured for this update, as row sharpness against the blurred fill), with all of the type
below it.

The petal field is told where that band is and maps into it, so the bursts stay on her feet
rather than landing somewhere in the blur, and petals fade out at the seam — falling on across
the surround reads as petals in front of the screen instead of in the room with her. The shafts
and the floor lift are landscape geometry and are hidden here: a 32° beam drawn across the full
viewport would cross the blurred fill as often as the room. The bloom stays, moved into the
band.

| | | size |
|---|---|---|
| `sunrise-desktop-2x.mp4` | 2092×1180, CRF 28 | 5.0 MB |
| `sunrise-desktop.mp4` | 1440×812, CRF 28 | 2.9 MB |
| `sunrise-mobile-2x.mp4` | 1080×2160, CRF 28 | 3.4 MB |
| `sunrise-mobile.mp4` | 720×1440, CRF 28 | 1.8 MB |

Lighter than Scene 02's plates — a dark, low-detail room and 210 frames instead of 305.
Exactly one is ever fetched, chosen the same way.

---

## Scene 04 — everything at once

The chapter that opens outward. Scenes 02 and 03 were interiors; this is a crowd in red
against open sky with the two of them held in the middle of it, and it ends by dissolving
into cloud.

### The plate

`Section 4.mov` plays the same trick as Scene 03's — 1180×2082, 16:9 landscape written
sideways with no rotation flag. Rotated back it is 2082×1180, 106 unique frames over 3.24s
(~32fps).

Trimmed at 0.26 to drop the whip past a wall, retimed 1.5× and motion-interpolated to 60fps:
**263 frames over 4.38s**. The crowd is the risky content for interpolation — dozens of small
moving heads — so that is where it was checked, at 2× zoom, before being trusted. What looks
like smearing in those frames is the source's own motion blur from the camera move; the
interpolated shapes are coherent.

| | | |
|---|---|---|
| T 0.00–0.55 | L 113 → 153 | the crowd rising into frame |
| T 0.55–2.10 | L 151, R−B −39 | the sustained shot, near-static |
| T 2.10–2.85 | L 154 → **210** | the dissolve into cloud |

**No `curve` here.** Scene 03 needed one because two thirds of its plate was a held frame;
this one has real motion at both ends and its still middle is exactly where the typography
lives, so a linear map spends the runway where there is something to see. Verified landing
within 0.011s of the intended frame at eight positions, forwards and backwards.

### The first cool chapter

The plate sits **39 points blue of neutral** where Scenes 02 and 03 sat 27 points warm. So the
grade runs the other way: it opens *deeper* while the crowd is coming up and then *lifts*,
rather than opening cool and warming. Two layers, and both of them get out of the way in the
middle where the plate is doing the work by itself.

### Ink again, and why transparency failed

The sky measures **L 163–185 at activity 0–4** across the whole upper quarter, and their heads
never rise above y 30%, so the band above them is clear for the entire sustained shot. Far too
bright for cream, so the type is ink — the same conclusion as Scene 02's sea wall.

The first pass set the two small lines in *transparent* ink, the way the dim supporting lines
work in Scenes 02 and 03. On a dark ground that reads as quiet; on a sky at L 0.43 it just
reads as pale, and both measured under the 4.5:1 a 10px line needs:

| | first pass | shipped |
|---|---|---|
| opening line | 4.0:1 | **6.1:1** |
| main line | 5.6:1 | 5.6:1 |
| supporting line | 3.4:1 | **5.4:1** |

Subordinate here has to come from scale and letterspacing, not from alpha. Worst cells, over
the glyph extents.

### The plate already performs the transformation

The chapter was rebuilt around one measurement. Sampling the plate's own red-minus-blue over
time:

| T | R−B | |
|---|---|---|
| 0.60 | −5 | the crimson crowd fills the lower frame |
| 1.20 | −31 | |
| 2.20 | −36 | |
| 3.20 | −38 | the crowd has sunk out, the sky owns it |
| 4.20 | −46 | dissolving into cloud |

The brief asked for red to give way to blue as an emotional transformation. The footage does it
on its own: a crowd in crimson fills the bottom of frame, the camera rises, and by the end there
is nothing but sky. He is in rust red and she is in blue, standing in the middle of it.

So the butterflies do not impose the arc — they ride it. Reds arrive while there is still
crimson in frame for them to belong to, blues take over as the sky does, and the two lights are
both up across the middle, which is the only place the frame is genuinely violet.

### The world

`assets/js/wings.js`. Butterflies in three depth layers, rose petals, motes, and one hidden
thing, over two canvases with the typography sandwiched between them — which is the only way to
get one butterfly passing in front of a line and another behind it in the same frame. Counted on
screen rather than guessed at, it peaks around 45 butterflies, 260 petals and 40 motes.

Position is a pure function of *q*, the same rule as Scene 03's petal field: every flight is a
closed-form curve evaluated at `u = (q − birth) / life`, so scrolling back un-flies it through
exactly the frames it came through. Verified rather than asserted — with the wing clock pinned,
the two canvases are byte-identical at q 0.75 whether reached by scrolling down to it, reversing
up to it, or on a fresh load.

**The one exception is the wingbeat**, which carries a slow clock term as well as a scroll term.
A butterfly held mid-air with its wings stopped is a sticker, not a held frame. It moves no
butterfly by a pixel, and under `prefers-reduced-motion` it is switched off entirely — the world
is then drawn from the paint pass and nothing in the chapter moves except in answer to the
scrollbar.

Depth is done three ways at once. The far layer is small, dim, and **dims further across the
couple's column** (x 34–58%, measured off the luminance map), which is what reads as passing
behind them. The mid layer flies in front but thins over their heads — a butterfly parked at
full strength across her face is not a depth cue, it is a blemish. The near layer is huge, soft,
short-lived and drawn on the canvas *above* the type.

Nine of the mid-layer butterflies carry a few rose petals in their wake: the petals ride the
host's own curve at `u` minus a lag, offset to one side and sinking as they go. §12 asked for the
two elements to read as one choreographed world rather than two effects sharing a frame, and a
butterfly crossing with petals following it through is the thing that actually does that.

### Three things that measured fine and read wrong

**The butterfly was a flower.** Scene 02's shape — four near-equal wings — is fine as a dark
silhouette on a bright frame, which is all it ever had to be. Filled with colour and shrunk to
flight size it reads as a four-petalled clover. The replacement has swept, pointed forewings,
smaller rounded hindwings, a slender body and antennae, and it was checked at 360 / 150 / 86 /
52 / 34 px, open and mid-beat, before it went anywhere near the chapter. Antennae cost two
strokes and do more for the read than anything else on the creature.

The dark margin nearly every butterfly has is stroked wide but **clipped to its own wing**, so
the outer half of the line never lands outside the silhouette. Unclipped, it left a grey fringe
against the sky.

**The wings folded to a bowtie.** The beat closed to 18% of span. The README already carried the
note from Scene 02 that a third reads as a bowtie for most of a crossing, which is most of what
anyone ever sees of it; this bottoms out near two thirds and is squared, so it sits open and
snaps through the closed part.

**The reds were invisible — and they were all there.** The count said 7 to 14 red butterflies on
screen the whole time. At flight size, a dark red butterfly on a blue sky is indistinguishable
from a dark red petal, and the chapter has hundreds of those. The fix was not more of them; it
was making wings brighter than the debris they share the air with.

A fourth, quieter one: petals were sized in fixed pixels while butterflies scaled with the
picture. Four percent of a desktop frame is eighteen percent of a phone's, and on the portrait
plate — whose picture is a band a quarter of the screen tall — that put petals the size of her
head across her face.

### The hidden thing

§18 asked for love symbolism that is discovered rather than announced. Nineteen motes drift into
the shape of a heart, hold for a moment in clean sky at x 78% / y 47%, and scatter again — once,
inside q 0.612–0.717, well off centre and clear of the type.

It took two corrections to make it exist at all. It was first drawn additively, and additive
light on a sky at L 170 adds nothing you can see; it now has its own tone, a soft rose *darker*
than the sky rather than brighter. And it was too large — nineteen points spread across a third
of the frame read as scatter, not as a shape. Small and tight, it resolves. Most people will
never consciously see it, which is the point.

The same correction applies to the motes generally: screened light is the obvious choice for
bokeh and it is the wrong one over a bright sky.

### Light, and what it cost

Two grade layers, `--kwarm` and `--kcold`, crossing over at the same q the butterflies do. The
warm one sits where the red actually is — the crowd along the bottom, measured R−B +30 to +78,
and his shirt at +43 to +79. The cold one is violet rather than blue, because the plate's sky is
already 46 points blue of neutral and blue on blue only greys it.

The swarm is drawn on its own rAF rather than from the scrub loop, because the scrub loop settles
the instant the scrollbar does. Holding still on the section cost **57% of a core** against a 35%
baseline, all of it to keep wings moving. It now redraws at film rate once the scroll settles:

| | idle CPU | script |
|---|---|---|
| before | 56.7% | 13.8% |
| at 24fps idle | 35.3% | 5.1% |
| baseline (section off screen) | 33.1% | 0.4% |

Which is to say the world is free when you are not scrolling. Under load — a sweep the length of
the section with a scroll on every frame — it holds 16.70ms median, p95 16.90ms, and 2 dropped
frames in 259.

### The release is into light, not into black

Every chapter so far has dissolved to black. This one does not. The plate blooms to L 210 by
itself, and **Scene 05's first frame measures L 157 at R−B −49** — the same bright, cool
world — so releasing to black here would put a hole between two frames that already belong
together. It settles into light instead.

Until Scene 05 is built there is nothing below this but the black ending, so the very bottom
of the runway is a step. That is the join waiting to be made, not a finished edge.

**In**: Scene 03 dissolves to black, holds it across the boundary, and Scene 04's blurred
crowd emerges from the same black — `--sedge` 1.0 / `--kenter` 0 at the join, 0.41 at +200px,
1.0 at +500px.

### Portrait

The portrait plate is its own encode again — the room-and-sky as a full-width band inside its own
blurred fill, measured for this rebuild at y 26.7–54.3% as row sharpness against the fill. The
world is told where the band is and maps into it, so the butterflies stay in the picture and fade
out at the seam rather than carrying on across the blur. The hidden heart is landscape-only:
there is no clean sky left to put it in.

Below the band the field is a blurred, darkened sky, so the type flips back to cream there —
ink would vanish into it. The main line is 44 characters and cannot fit on one at 390px, so it
is allowed to break, with `text-wrap: balance` so the two lines carry roughly equal weight.

| | | size |
|---|---|---|
| `sky-desktop-2x.mp4` | 2082×1180, CRF 28 | 4.9 MB |
| `sky-desktop.mp4` | 1440×816, CRF 28 | 2.8 MB |
| `sky-mobile-2x.mp4` | 1080×2160, CRF 28 | 3.9 MB |
| `sky-mobile.mp4` | 720×1440, CRF 28 | 2.1 MB |

---

## Scene 05 — a night that stayed on

Night, rain, and a wall of bokeh — and then, one at a time, a night full of small lights that
wake up inside it. The most dynamic plate in the building, and the only one dark enough to let
a single light arrive.

### The plate

`Section 5.mov` — 1180×2088, sideways again, 101 unique frames over 3.16s. Rotated back it is
2088×1180. Retimed 1.4× and interpolated to 60fps: **263 frames over 4.38s**. Checked on the
swirl, which is the highest-motion content anywhere in the film; the rain droplets survive it,
which is the hardest thing in a frame to interpolate.

**Nothing is trimmed off this one.** Its opening mist is the join *from* Scene 04, which
dissolves into exactly that, and its warm bloom is the join *to* Scene 06. Both ends are
load-bearing.

| | | |
|---|---|---|
| T 0.00–0.70 | L 164 → 67, R−B −52 → −8 | the mist clearing |
| T 1.26–2.94 | L 36 | the night, dancing |
| T 2.94–4.10 | L 35 → 87, R−B → −56 | the bokeh swirl |
| T 4.10–4.38 | L 87 → **173**, R−B → **+61** | the warm bloom |

It travels **117 points of colour temperature** end to end. Nothing here needs to add to that,
so the grade is two nearly weightless layers: violet in the shadows where the bokeh already
puts it, and the bloom carried a half-step further.

**No `curve`.** This is the first plate with continuous motion all the way through — the dance
never stops — so there is no dead stretch for a ramp to skip past.

### Typography with nowhere obvious to go

This is the first frame with neither bright negative space nor dark. The whole lower two
thirds measures L 0–20, but most of that is *them*: he is at x 8–38%, she at x 33–56%, and
their silhouettes run to the bottom of frame.

What is actually empty is the right third — a plum wall at L 26–57 with rain across it, cols
14–23, activity 3–16. So the type sits in a column beside them. It starts at 62vw rather than
60vw because the camera drifts right through the shot and her hair reaches x 56–58% while the
line is still arriving; two viewport-widths of clearance cost a point of type size and buy the
margin back at the one moment it is thin.

### The glow had to become a scrim

Every other chapter puts *light* behind its words. This one cannot. The type is cream on a
night, and a screened glow brightens the one thing that is already the problem — measured with
the screen version, a bokeh light sitting directly behind the line took the worst cell to
**1.06:1**. A bright lamp under cream letters.

Replacing it with a soft elliptical scrim, normal blend, present for as long as the line is —
not a panel and not a blanket, the same conclusion Scene 01's title reached about its own
worst frame:

| main line | before | after | after the rebuild |
|---|---|---|---|
| at T 2.29 | 1.06:1 | **3.16:1** | **3.82:1** |
| at T 2.54 | — | **3.79:1** | **4.64:1** |
| at T 2.80 | — | **13.90:1** | **8.47:1** |

Measured at three moments on purpose: the bokeh moves, so a single sample would have been
worth nothing. Worst cells; the tight text-shadow adds more on top and this measurement cannot
see it.

### The one place in the film a light can arrive

The chapter was rebuilt around a single number. From T 1.20 to T 2.70 the plate sits at
**L 36 and does not move** — a second and a half of flat, unchanging night, the darkest and
stillest stretch anywhere in the building. Its activity map over that window reads 0–2 across
every cell. Nothing else in the film gives a small light that much room to be seen arriving.

So the brief's *darkness → one light → another → many* is not imposed here; it is placed in the
one window that can hold it. Nothing is added before q 0.21, because until then the plate is
still falling out of the mist at L 66–158 and a small light has nothing to arrive out of.

### Additive here, and screened was wrong in Scene 04

Scene 04 taught the inverse of this lesson the hard way: over a sky at L 170, screened light
adds nothing you can see, and its hidden heart had to be re-cut in a tone *darker* than its
ground before it existed at all.

This chapter's ground is a night at L 36. Every light in `lumen.js` is drawn with `lighter`,
which is what makes them read as sources rather than as pale stickers — and what makes two of
them overlapping brighter than either, the way light actually behaves. The ambient layer they
wake, `--rlit`, is screened for the same reason, and both of its glows are anchored to where
the plate's real light already is: the blue-white cluster at x 20–70% / y 0–20% and the warm
amber points at x 55–80% / y 20–60%.

### One light, then another, then more

Counted on screen rather than described:

| q | lights |
|---|---|
| 0.22 | **0** |
| 0.25 | **1** |
| 0.28 | 2 |
| 0.32 | 4 |
| 0.36 | 14 |
| 0.50 | 96 |
| 0.74 | **150** — the peak, under the swirl |
| 0.90 | 108, still burning as the chapter lets go |

The first five are placed by hand rather than sampled, in ground the luminance map measures at
L 0–27, spaced about 0.025 apart in q so each is its own event. They also run at near-full
opacity and barely drift: a first light that has to be looked for is not a first light.

An earlier cut had the pool starting at q 0.250, which put a dozen lights on screen between the
first hand-placed one and the second — five arrivals turned into a fade-in. The pool now waits
until 0.348, after all five have had the frame to themselves.

### Pop, glow, settle

§14 asked for an arrival rather than a fade, so every light runs a birth envelope over the
first sixth of its life: a tiny intensely bright point strikes, opens quickly into a glow, and
settles a little smaller and calmer than its peak. **Nothing bounces** — the overshoot is in
the brightness and the radius, never in the position, which is what separates it from a bouncy
easing curve.

Three profiles, because a distant light and an out-of-focus one are not the same object at
different sizes: a hard core with a small halo for the far layer, an even falloff for the
fireflies, and a flat disc with a brighter rim for the foreground, which is what a real
out-of-focus highlight looks like.

Position is a pure function of *q*, the rule the last three chapters share. Verified: with the
clock pinned, both canvases are byte-identical at q 0.75 whether reached by scrolling down,
reversing up, or on a fresh load. Pulse and flicker carry the clock and move nothing by a
pixel; under `prefers-reduced-motion` they are switched off entirely.

Idle cost, holding still on the section: **28.5% of a core against a 28.9% baseline** — free,
because the loop drops to film rate the moment the scroll settles. Under a full-length sweep it
holds 16.70ms median, p95 17.00ms.

### The scrim, re-measured — and a test that was wrong first

The new copy is longer than the line it replaced and sits over a brighter part of the plate, so
the scrim was measured again over the glyph extents. The first run reported a worst cell of
**1.03:1** and looked like a disaster.

It was the measurement. `.rain-main__glow` — the scrim — lives *inside* `.rain__type`, so
hiding the type to photograph the ground hid the one layer the words are legible because of. It
measured a page that does not exist.

Re-run with the scrim kept, and with the layers switched on and off one at a time:

| under the heading's first line | brightest pixel |
|---|---|
| everything on | 126/255 |
| foreground canvas off | 126/255 |
| both canvases off | 126/255 |
| scrim off | 246/255 |

Identical with the lights and without them. **The lights contribute nothing to the worst pixel**
— it is the plate's own rain, and the scrim is the only thing standing between it and the type.
Taking the scrim from .66 to .78 moves the worst cell from 2.94:1 to **3.82:1**, clear of the
3:1 WCAG asks of text this size, on means of 11.8–15.4:1. It is invisible on a frame this dark.

Two smaller consequences. The eyebrow carries no scrim and does not need one — 11.5:1 on the
mean — but its worst pixel is a lit rain droplet at 3.18:1, so it gained a 4px dark ring hugging
the strokes, which is the one thing that keeps a droplet from touching a letterform. And
`.rain-main__glow { display: none }` was removed from this chapter's reduced-motion block: that
rule is right in every other chapter, where the element is a decorative light, and wrong in the
only one where it is the scrim. It had been copied across.

### The join defect, and the rule that came out of it

Scene 04 is the first chapter to release into light rather than black, and that exposed
something every earlier join had been hiding.

**A chapter's plate fades up from its frame's background.** While `--renter` climbs from 0,
what the reader actually sees is `.rain__frame`'s background colour. Every chapter up to Scene
03 released into black *and* arrived over black, so it never mattered. Scene 04 hands over in
pale light — and a black ground here put a flash of black between two frames that were meant
to dissolve into each other.

Measured mean luminance across the boundary, after the fix:

| −600px | −200px | 0px | +200px | +500px | +900px |
|---|---|---|---|---|---|
| L 214 | L 212 | **L 203** | L 179 | L 124 | L 72 |

A monotonic descent from light into night, with no hole in it.

**The rule for Scene 06:** its frame background must be the warm pink Scene 05 ends on
(around `#e2b7ad`), not `#000`. `.rain`'s own background is `#cfe4e6` for exactly this reason.

*(Worth knowing if you re-run any of this: the CDP helper scripts exit with a Node teardown
code of 127 even on success, which silently breaks a `cmd && cmd` chain. A stale contact sheet
from that is what made this look unfixed for one round.)*

### Portrait

The band composition again — 1080×610 inside its own blurred light at 26–54% of the height,
type below it.

| | | size |
|---|---|---|
| `rain-desktop-2x.mp4` | 2088×1180, CRF 28 | 5.8 MB |
| `rain-desktop.mp4` | 1440×814, CRF 28 | 3.2 MB |
| `rain-mobile-2x.mp4` | 1080×2160, CRF 28 | 3.9 MB |
| `rain-mobile.mp4` | 720×1440, CRF 28 | 2.1 MB |

---

## Scene 06 — after everything

The last chapter, and the only one staged rather than filmed: a burning sky, a chandelier
hanging in it, a red dais, and a ring of cloaked figures closing around the two of them.

### The plate

`Section 6.mov` — 1180×2078, sideways like the rest, and the shortest of them: **76 unique
frames over 2.51s**. Retimed 1.5× and interpolated to 60fps gives 224 frames over 3.73s, which
is three synthetic frames for every real one — more than anywhere else in the film. Checked on
the fabric sweep, the fastest thing in it; the cloth stays coherent, and the tableau behind it
is untouched because the tableau barely moves.

| | | |
|---|---|---|
| T 0.00–0.45 | L 135 → 43, R−B +73 → +25 | black fabric sweeps in |
| T 0.60–2.25 | L 78 → 95 | the tableau, near-still |
| T 2.25–3.45 | L 95 → 130, R−B → **+86** | the push-in to the close |

**+86 makes it the warmest plate in the building** by a wide margin, and the tableau measures
**activity 0–4** across almost the whole frame — the stillest as well. Both of those are what
let the typography sit in the sky and simply stay there.

Nothing trimmed: it opens at L 135 / +73 and Scene 05 ends at L 173 / +61, so the two plates
already meet.

### A light halo, which is the dark shadow inverted

The type sits in the sky at upper-left — left rather than centred because the centre is spoken
for twice over, by the chandelier at cols 9–13 and by the two of them standing directly under
it with their heads at y 23%.

But this sky is not one brightness. It is **banded, L 121–200**, so ink lands on the blaze and
on the cloud in the same line. Two things fixed it: a stronger warm lift under the block, and a
**pale halo hugging the letterforms** — precisely the dark tight shadow that carries cream on a
bright frame, run the other way.

| worst cell | before | after |
|---|---|---|
| opening line | 3.75:1 | **5.97–7.45:1** |
| main line | 3.64:1 | **4.49–6.49:1** |
| supporting line | 4.43:1 | **6.74–7.94:1** |

Measured at three moments with the lift in place, because the plate drifts under it.

### The flower field

`assets/js/bloom.js`, and the largest of the four canvases in the building. Eleven DOM embers
used to rise here; they are gone. §03 asked for much richer than Scene 03 and §06 for
significantly more petals than it had — Scene 03 peaked near 260 petals and no flowers at all.
Counted on screen:

| | at the peak |
|---|---|
| flowers | **~76** across three depth layers |
| petals | **~620** |
| foreground blooms and glints | ~10 |

Position is a pure function of *q*, the rule all four fields share. Verified: with the clock
pinned, both canvases are byte-identical at q 0.75 scrolled down to, reversed up to, and freshly
loaded. Sway and glint carry the clock; under `prefers-reduced-motion` they are off and the
field is drawn from the paint pass.

### A bud is a wound flower, not a small one

§05 asked for flowers that open rather than appear. The first cut scaled a finished rosette up
from nothing, which is a zoom, not a bloom. Each flower is now two rings of teardrop petals that
start **narrow, overlapping and twisted** and unwind as they open — six baked stages, two of
them cross-faded at a time so the opening is continuous rather than stepping. Checked at
190 / 110 / 64 / 38 px across all six stages, on the burning sky *and* on the dark crowd, before
any of it went into the chapter.

That two-ground test is the whole difficulty of this frame. It is not one backdrop but two: a
sky at **L 95–197** across the top half and a crowd and dais at **L 1–40** below it. A flower
has to be an object on both, which is why every petal carries a dark margin stroked wide and
**clipped to its own silhouette** — the same lesson Scene 04's butterflies taught against their
sky, applied here to a shape that has to survive twice as much range.

### Three corrections

**They were decals.** The radial fill put the pale core's midpoint at 55%, which swallowed the
petal; every flower read as a translucent sticker laid on the sky. The core is a highlight now,
not the flower, and the margin is nearly twice as strong.

**They all faced the camera.** A rosette drawn square-on is a decal however well it is coloured.
Squashing one axis per flower reads as a bloom seen at an angle, and a field of them at
different angles stops looking like a sheet of stickers. It costs nothing — it is the same
transform, with one term changed.

**The ending was a cut, not a settle.** §13 asks for the field to calm before the frame is
handed on; an earlier cut still had it at 62% strength on the last frame. The flowers now begin
thinning at q 0.80, the foreground stops arriving at 0.70, and the plate's final composition is
held clean from 0.900 to 0.968 — about a third of a screen of scroll with nothing on it but the
two of them. The first version allowed 86 pixels.

### Light, and what it cost

§07's light is the sunset, and the sunset is above: one expression, `litAt(y)`, decides both how
bright a flower is drawn and which of three baked levels a petal picks, so a bloom high in the
frame catches the sky and one down among the crowd does not. `--frose` opens the colour back up
after Scene 05's night — rose and lavender over the plate's own heat, weighted to the sky and to
the dais where the red already is.

The field is drawn on its own rAF, throttled at rest to **15fps** rather than the 24 the other
chapters use: this is the heaviest field in the film and at rest the only thing still changing
is a sway running at `clock * 0.5`. The glints are driven by scroll, not by the clock, so
nothing strobes.

| | |
|---|---|
| under a full-length sweep | 16.70ms median, p95 17.00ms |
| holding still on the peak | 31.0% of a core against a 24.8% baseline |
| holding still past q 0.90 | 19.5% — below baseline, because nothing is drawing |

### The metric was pointing the wrong way

Every other chapter sets light type on a dark ground, so its worst case is the *brightest* pixel
under a glyph. This one is the only chapter with **dark ink on a bright ground**, and the first
contrast run reported the brightest pixel here too — which is the *best* case for dark ink, and
returned a comfortable 9–12:1 for type that was not comfortable at all.

Measured correctly, against the darkest pixel:

| | mean | worst cell |
|---|---|---|
| eyebrow, in its own window | 5.5–6.2:1 | **4.14:1** |
| main line | 7.4–9.2:1 | 4.33:1 |
| supporting line | 8.8–10.3:1 | 5.04:1 |

The eyebrow gained a 4px pale ring hugging its strokes — the exact inverse of the tight dark
ring the cream chapters use, and the thing that keeps a dark cloud band off small type. The
measurement is of the ground and cannot see it.

A second phantom worth recording: measuring the eyebrow at q 0.42–0.72 gave sensible-looking
numbers for an element whose beat ends at 0.382. It was not on screen. Any contrast reading has
to be taken inside the window the type is actually up.

### Both joins, and the end of the film

**In**: Scene 05 releases into its own warm bloom, so `.fin__frame`'s background is that pink
(`#e2b7ad`) rather than black — the rule Scene 05 established. Measured across the boundary:
L 181 → 181 → 181 → 157 → 44. No hole.

**Out**: this is the only chapter that goes to black, because what it hands over to is the
ending. Measured at the very last frame of the runway: **L 1**. The film opens on a black frame
held until the plate can play, and closes on the same thing.

| | | size |
|---|---|---|
| `finale-desktop-2x.mp4` | 2078×1180, CRF 28 | 5.9 MB |
| `finale-desktop.mp4` | 1440×818, CRF 28 | 3.5 MB |
| `finale-mobile-2x.mp4` | 1080×2160, CRF 28 | 4.0 MB |
| `finale-mobile.mp4` | 720×1440, CRF 28 | 2.2 MB |

---

## The ending

Not a footer. The last page of the film, and the only part of the building that is not a
chapter: no plate, no canvas, no transport — a `[data-scene]` block whose `--q` comes from the
same scroll driver the hero's captions use.

**The join is black to black.** Scene 06 dissolves to black at q 0.968 and the ending's own
background is `#000`, so there is nothing to cross-fade: measured at the boundary, `--fedge` is
0.98 for 900px before the ending's `--q` leaves zero. What follows is roughly a screen and a
quarter of black before the mark arrives, which is the beat between a last frame and a title
card rather than dead space.

The order is §20's, and each thing arrives well after the last has landed, because a card that
assembles all at once is a web page:

| | |
|---|---|
| q 0.14–0.42 | the mark resolves out of blur |
| q 0.30–0.56 | the last line |
| q 0.46–0.70 | the three links |
| q 0.60–0.82 | the small print |

The mark is the **same artwork the film opens on**, at about a third of the size — an opening
title and a closing card are one object seen twice, and the second should be the quieter. Behind
it, §14's "faint remnants of the final section's colours" is an afterimage rather than a carried
frame: Scene 06 releases to black, so a warm rose haze that is already leaving as the mark
arrives is the only honest way to read as a remnant.

The links are set as credits, not as navigation — 11px, 0.28em tracking, a rule that draws
itself from the left on hover and a 2px lift, and nothing else. §17 asked for them not to become
a second set of the hero's controls; the hero's own platform buttons were removed earlier in the
build for the same reason, and this is where they come back.

## The film, end to end

Six chapters, five of them scroll-scrubbed on one shared transport.

| | | the plate does | the type sits |
|---|---|---|---|
| **I** | the fall | a 4.9s loop, autoplaying | gold title, y 44% |
| **II** | the memory | crowd → embrace → light leak → sea wall | cream low-left, then ink in the sky |
| **III** | the light | darkness → a room filling with morning | cream in the dark top wall |
| **IV** | above everything | a crowd rising → dissolving into cloud | ink in open sky |
| **V** | the night it rained | mist → night → bokeh swirl → warm bloom | cream in a column beside them |
| **VI** | after everything | fabric → a burning tableau → the close | ink in the fire, with a pale halo |

The colour runs gold → warm room → cool sky → night → fire, and the joins are all measured
rather than assumed. Every chapter's frame background is the colour the previous one hands
over on; only the first and the last are black.

**Whole-film traverse, 500 frames with all five plates buffered:** 1.28 ms/frame of style,
0.08 of layout, 0.20 of script — *the same numbers as when there were two chapters*, because
only the on-screen section's loop ever runs. 1728 nodes, 48 listeners, 33,480px of document.
All five plates land on their final frames. No console errors at any of nine viewport sizes,
no horizontal overflow, and all sixteen text blocks stay inside the frame.

**Payload**: one plate per chapter is fetched, chosen by composition and by display. A
desktop reader at 2× fetches 9.4 + 5.0 + 4.9 + 5.8 + 5.9 = **31 MB** across the whole film,
none of it before the hero has arrived and none of it until the chapter is within two screens.
Halve that by deleting the `-2x` rows from each chapter's `PLATES`.

---

## Still needed from you

Everything renders — but **13 elements have no destination yet**. An item with no `href`
still reads but cannot be clicked, so nothing can ship as a link to nowhere:

```bash
grep -rn "data-pending" assets/js/hero.js
```

Fill in `href` on `nav` (About / Music / Story / Gallery), `social` (Instagram / Facebook /
YouTube) and `platforms` (Spotify / YouTube) in `assets/js/hero.js`.

Also still empty, and rendering nothing until supplied:

```js
captions: [],                 // the breakup captions
ending:  { links: [], note: '' }
```

Each `captions` entry is one cinematic moment; each string inside it is one line, revealed on
its own beat and paced by scroll rather than a clock. Punctuation is preserved verbatim.
Until they are supplied the scroll runs hero → ending, which is why there is a long stretch
of darkness between the two — that space is where the captions go.

Copy taken **from the reference image**: `A STORY THAT ECHOES.`, `EVERY MELODY HAS A MEMORY.`,
`PLAY THE THEME`, `SCROLL TO EXPLORE`. Change any of them at the top of `hero.js`.

One deliberate departure from the written spec: §07 asked for gold button typography, but the
reference shows white. The reference won, since §11 makes it the visual authority.

---

## Production notes

- **Serve video over HTTP Range.** Most hosts do; `python -m http.server` does not, and
  Chrome then reports the plate as unseekable. Scene 02 is *entirely* seeking, so on a host
  without Range it does not degrade — it simply does not run.
- Give `assets/` a long `Cache-Control` — the filenames are stable.
- **Scene 02's plate is the whole page weight.** Scene 01 arrives in ≈600 KB; Scene 02 then
  fetches one file of 3.8–9.4 MB depending on the display. That is inherent to all-intra —
  it is what buys the scrubbing — and it is deferred, but it is a real payload and worth
  knowing before this goes on a metered host. Dropping the `-2x` files and their two rows
  from `PLATE` in `memory.js` halves the worst case and costs only sharpness on high-DPI
  screens.
- Autoplay works because the video is `muted` + `playsinline`. If a browser refuses anyway,
  the poster stays up and the rest of the sequence still runs.
- Without JavaScript the scene simply exists, fully revealed.

### Measured

- Whole-document scroll: median 16.7ms/frame, **p95 17.4ms**, at 1440×860.
- Title contrast: worst case across the loop 3.68:1, typical ~5.9:1.
- Atmospheric treatment shifts plate luminance by under 7%.
- `prefers-reduced-motion`: scenes still play, captions still arrive with scroll, but nothing
  blurs, drifts, slides or grains.

**Scene 02**, over a 360-frame scripted traverse of the whole runway:

- **2 style recalcs and 1 layout per frame** — the same shape as Scene 01 under the same
  test, at ~1.4× its cost for 18 property writes instead of 4 plus a video seek. Nothing in
  the section forces layout; the one layout per frame is the sticky pin, which Scene 01 pays
  for too.
- Transport lands within **±0.014s** of the requested frame at every position tested,
  forwards and backwards, on both the 1440 and the 2160 plate — under half a frame at 25fps.
- No horizontal overflow and no text leaving the frame at 1920×1080, 1440×860, 1280×720,
  1024×640, 768×1024, 414×896, 390×844 or 360×800.
- `prefers-reduced-motion`: the film still answers the scroll — it is the content, and it
  only moves when the reader does — but every drift, wingbeat, grain and resolving blur
  stops, and the mask reveal becomes a plain fade.

Two things worth knowing if you re-measure any of this. `html { scroll-behavior: smooth }`
is set for the logo and the scroll cue, so scripted scrolling must pass
`behavior: 'instant'` or the page barely moves and the numbers are meaningless. And
`chrome --screenshot` always captures at scroll 0 regardless of where the page is; anything
that needs a pinned section on screen has to go through CDP `Page.captureScreenshot`.

**One performance trap worth knowing about.** `--p`, `--mx` and `--my` are written every
frame. On `:root` an *inheriting* custom property invalidates style for the whole document —
harmless when the page was only a hero, but once the interface layer added ~100 elements it
cost roughly 16ms of every scroll frame (p95 33.4ms, 22 dropped frames). They are now
registered `inherits: false` and written directly onto the four elements that read them.
Same visual result, p95 back to 17.4ms. If you add anything that reads them, add it to
`pTargets` / `mTargets` in `hero.js` — do not move them back to `:root`.
