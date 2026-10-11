# Ironveil website

A responsive, static site for GitHub Pages. Source pages are plain HTML and CSS with one small progressive-enhancement script; `npm run build` produces minified HTML/CSS/JS, content-hashed assets, and responsive AVIF/WebP image sets in `dist/`. The build uses a pinned Node version and lockfile. No runtime framework, external fonts, trackers, CDNs or third-party video embed are used.

## Build and check locally

Requirements: Node `22.16.0` (see `.nvmrc`) and Python 3.

```sh
npm ci
npm test
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. The build strips image metadata and checks responsive variants, local links, page/image/media budgets, and sitemap/robots output. Build inputs remain at the repository root; only `dist/` is deployed. See [TODO-OWNER.md](TODO-OWNER.md) before any public launch and [docs/deploy.md](docs/deploy.md) for the gated publishing steps.

## Production output

The `Build and deploy Ironveil Pages` workflow validates pull requests without deploying them. A push to `main` builds and uploads `dist/`; deployment is additionally gated by the repository variable `PAGES_DEPLOY_ENABLED=true`. Keep the variable unset and Pages disabled until the pull request is merged and the owner has supplied all launch details. Owner-only configuration remains an explicit prerequisite. The site uses relative internal URLs so the repo subpath and a later custom domain work without a build-time base-path rewrite.

The site intentionally states that no playable browser demo or store release is available. The Demo & Media page contains only actual early-build gameplay captures; storyboard art and the motion study remain review-only and are excluded from production.
