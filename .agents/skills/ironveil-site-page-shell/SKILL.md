---
name: ironveil-site-page-shell
description: Use before editing any route under the seven page inventory, or changing head metadata, navigation, footer, theme toggle, or relative asset paths.
---

# Ironveil site page shell

Trigger: before editing any route under the seven page inventory, or changing head metadata, navigation, footer, theme toggle, or relative asset paths.

Scope: route inventory, relative-path conventions, shared header/nav/footer template, theme bootstrap ordering, favicon link set, page budget.

## Core rules

1. Edit pages as directories named `*/index.html`; add new pages only by extending both `sourcePages()` and `PAGES`.
2. Keep head order: charset, viewport, theme-color, description/OG tags, title, favicon/apple icons, theme bootstrap script, stylesheet, deferred site.js.
3. Mark the current page with `aria-current="page"`.
4. Footer inventory (brand, Game, Help, Follow, bottom status) is shared; a channel change must be applied to every route's footer in the same PR.
5. Use relative `../` or `./` links, never root absolute, because pages ship from a subpath on GitHub Pages.
6. Re-run `npm test` or at least `npm run check` before declaring done.

## Out of scope

- Public/factual copy and evidence tracing (owned by `ironveil-site-verified-copy`).
- Responsive image and media markup (owned by `ironveil-site-responsive-media`).
- Footer generation by `scripts/build.mjs`: the build does not template the footer; keep manual synchronization across all routes.