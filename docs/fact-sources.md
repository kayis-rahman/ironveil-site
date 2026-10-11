# Art and factual sources

## Public art

The homepage hero uses the approved Freya identity artwork in `assets/brand/favicon.png` as a contained, right-side figure. It is not used as a full-screen background. The build generates responsive AVIF and WebP variants from this source image.

The site's gameplay galleries use these original Ironveil captures from `assets/source/gameplay/`; the production build derives responsive AVIF and WebP variants from each source:

- `deity-select.webp` — deity and rival-temperament selection.
- `island-phone.webp` — wide island-play capture; retain its 1000×462 aspect ratio.
- `island.webp` — island gameplay and resource controls.
- `result-win.webp` — match result screen.
- `winter-island.webp` — winter gameplay.

No generated images, reference-site artwork, storyboard stills or motion-study frames are used.

## Product and privacy facts

The public-facing game privacy and support claims remain marked for confirmation against the Ironveil game code in `TODO-OWNER.md`. Website implementation facts on the Privacy page are derived from this repository's static HTML, CSS, build output and scripts; GitHub Pages hosting disclosures refer to GitHub's published privacy statement.
