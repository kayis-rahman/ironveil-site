---
name: ironveil-site-verified-copy
description: Use before writing or changing public claims about gameplay, release status, privacy, support, contact channels, or owner facts.
---

# Ironveil site verified copy

Trigger: before writing or changing public claims about gameplay, release status, privacy, support, contact channels, or owner facts.

Scope: evidence map, source-vs-unverified rules, owner placeholders, contact routing, checker-enforced strings.

## Core rules

1. Every gameplay/release/privacy/support claim must trace to `docs/fact-sources.md` or cite a code/audit source directly.
2. Anything that cannot be verified is marked unverified in a `.placeholder` block, never silently stated as fact (see `privacy/index.html:41-47`).
3. Owner-supplied facts (legal name, privacy contact, support email, trader status) stay as placeholders until the owner confirms them (`privacy/index.html:67-69`, `support/index.html:45`).
4. Public contact policy: GitHub issues for non-sensitive reports, explicit mailto subjects for support/privacy, no public TestFlight link, no store availability claims without confirmation. Keep these strings in sync with `check_alpha_links` (`scripts/check_site.py:157-173`, `319-331`).
5. Build-time variable labels (`@@GOD_*@@`) replace wording edits across pages; do not hard-code character names into the field-guide template.

## Out of scope

- HTML page chrome and route inventory (owned by `ironveil-site-page-shell`).
- Responsive image and media markup (owned by `ironveil-site-responsive-media`).
