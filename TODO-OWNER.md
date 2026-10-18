# Owner tasks for launch details

The site can publish with the clearly identified legal/contact/trader placeholders below. Game and website claims are sourced in [docs/fact-sources.md](docs/fact-sources.md); the Privacy page was fact-checked against those sources on 2026-10-18 and still needs the captain's approval before publication.

## Captain-owned

- [x] Footer copyright confirmed as “© 2026 Kayis Rahman” (captain, relayed by firstmate on 2026-10-18); applied to all page footers. The App Store copyright field is for the listing update, not this site.
- [ ] Supply the legal name for the Privacy page's “Controller / legal developer” line.
- [ ] Supply and test a monitored privacy contact address. General product support, bug reports and alpha-access requests use this repository's public GitHub Issues; the Support page keeps a marked, unpublished email slot for a support address - supplying one is the captain's decision.
- [ ] Self-assess EU trader status and authorize any legally required trader details before publication.
- [ ] Approve the fact-checked Privacy page before publication; update it if the live service or data practices change.

## Art approval

- [x] On 2026-10-11, the captain approved the screenplay plates as the canonical Ironveil visual reference and directed that `01-1a.png` be used as the public-site full-bleed hero. The source remains read-only; the site uses an optimized WebP derivative. Record this and the origin in [docs/fact-sources.md](docs/fact-sources.md). Approval may be withdrawn before merge.
- [x] The captain approved these existing assets for public use on 2026-10-11; approval may be withdrawn before merge:
  - `assets/brand/favicon.png` as the favicon only.
  - `assets/source/gameplay/deity-select.webp`, `assets/source/gameplay/island-phone.webp`, `assets/source/gameplay/island.webp`, `assets/source/gameplay/result-win.webp`, and `assets/source/gameplay/winter-island.webp` as early-build gameplay gallery images, not final store screenshots.

## Firstmate post-merge setup

- [x] Namecheap DNS and the GitHub Pages custom domain for `ironvei-game.online` are already configured (observed 2026-10-18; see [docs/deploy.md](docs/deploy.md)).
- [ ] After the approved merge, decide on HTTPS enforcement (`https_enforced=false` as observed), then verify apex and `www` redirects, canonical tags and sitemap behavior. Do not change DNS or Pages settings as part of this site change.
