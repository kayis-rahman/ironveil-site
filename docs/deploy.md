# Deploy to GitHub Pages

This repository builds its static site into `dist/`. The pinned GitHub Actions workflow validates pull requests and deploys `dist/` automatically on pushes to `main`, once GitHub Pages is configured to use **GitHub Actions**. The site may publish with the clearly marked owner placeholders; the owner can replace them when verified details are available.

## Setup and verification

1. In **Settings → Pages**, set the source to **GitHub Actions**. Do not select a branch-folder publishing source.
2. Confirm the `github-pages` environment permissions and the repository Actions policy allow the pinned Pages actions. The workflow grants only `contents: read` to the build job and `pages: write` / `id-token: write` to deployment.
3. After a push to `main`, open the published `https://kayis-rahman.github.io/ironveil-site/` URL. Check Home, How to Play, Demo & Media, Release, Privacy, Support and 404; test AVIF/WebP images, navigation, reduced motion, desktop/mobile layout, `robots.txt` and `sitemap.xml`.
4. Track unresolved owner details and factual placeholders in `TODO-OWNER.md`; they do not gate deployment.

## Local validation and preview

```sh
npm ci
npm test
python3 -m http.server 8000 --directory dist
```

The build can be configured with `SITE_URL` when the final public location changes. Internal URLs remain relative; the sitemap, robots sitemap pointer and Open Graph share image use the configured public URL.

If the GitHub Actions policy prevents this workflow from running, resolve the repository Actions policy. If Actions truly cannot run, propose the `docs/`-folder publishing alternative to the owner; do not maintain two deployment sources simultaneously.

## Later custom domain

Only after a domain is chosen and the owner approves it: configure DNS to the exact values GitHub Pages shows, add the domain under **Settings → Pages**, verify DNS and HTTPS, then set `SITE_URL` to the final HTTPS site URL and update the workflow/release process as appropriate. Do not add a `CNAME` file until the domain is configured. Recheck the sitemap, robots pointer, social metadata, HTTPS and redirects after propagation.
