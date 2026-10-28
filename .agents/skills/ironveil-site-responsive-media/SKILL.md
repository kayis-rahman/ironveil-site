---
name: ironveil-site-responsive-media
description: Use before adding or modifying any <picture>, story frame, or gallery card media.
---

# Ironveil site responsive media

Trigger: before adding or modifying any `<picture>`, story frame, or gallery card media.

Scope: picture markup requirements, lazy/defer rules, alt text, responsive widths, build processing, page/media budgets.

## Core rules

1. Use `<picture data-image="assets/source/...">` with two `<source>` entries and an `<img>`; never bypass build processing.
2. Provide AVIF and WebP sources and the exact width set (`scripts/check_site.py:27,232-234`).
3. Primary frame may be eager (`fetchpriority="high"`); all others `data-defer` lazy, with noscript fallback handled by build (`scripts/build.mjs:158-188`).
4. Alt text must describe the visible content and identify early-build captures as early-build where applicable (`index.html:130,134,138`).
5. Respect image (500 KiB) and media (750 KiB) budgets; let Sharp strip metadata.
6. New source images are added to both source pages and build inputs; keep `assets/source/*` out of direct URLs.

## Out of scope

- HTML page chrome and route inventory (owned by `ironveil-site-page-shell`).
- Public/factual copy and evidence tracing (owned by `ironveil-site-verified-copy`).
