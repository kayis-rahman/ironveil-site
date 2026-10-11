# Ironveil website

A small, static, mobile-first site for GitHub Pages. No build step, framework, external fonts, trackers or runtime JavaScript.

## Preview and checks

From the repository root, run `python3 -m http.server 8000` and open `http://localhost:8000`. Run the local quality checks with `python3 scripts/check_site.py` (requires Python 3 and macOS `tidy`/`sips`). See [docs/deploy.md](docs/deploy.md) for owner-only publishing steps and [TODO-OWNER.md](TODO-OWNER.md) for launch details still to supply.

The site intentionally has no store links or playable browser demo yet. The game is offline; Godot 4 C# cannot export to web. Do not publish until owner placeholders and policy are reviewed.
