# Ironveil website

A responsive, static site for GitHub Pages. Source pages are plain HTML and CSS with one small progressive-enhancement script; `npm run build` produces minified HTML/CSS/JS, content-hashed assets, and responsive AVIF/WebP image sets in `dist/`. The build uses a pinned Node version and lockfile. No runtime framework, external fonts, CDNs or third-party video embed are used; optional Google Analytics loads only after visitor consent.

## Build and check locally

Requirements: Node `22.16.0` (see `.nvmrc`) and Python 3.

```sh
npm ci
npm test
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. The build strips image metadata and checks responsive variants, local links, page/image/media budgets, and sitemap/robots output. Build inputs remain at the repository root; only `dist/` is deployed. See [TODO-OWNER.md](TODO-OWNER.md) for pending owner facts and [docs/deploy.md](docs/deploy.md) for Pages setup.

## Publishing

See [docs/deploy.md](docs/deploy.md) for GitHub Pages setup, publishing behavior and deployment prerequisites. Pending owner facts are tracked in [TODO-OWNER.md](TODO-OWNER.md). Internal links are relative, so the site works from the repository subpath and a later custom domain without a build-time base-path rewrite.

The site states that no playable browser demo or store release is available. The landing page presents approved cinematic story frames alongside early-build gameplay captures; see [docs/fact-sources.md](docs/fact-sources.md) for art status.
