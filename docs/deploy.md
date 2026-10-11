# Deploy to GitHub Pages (owner-gated)

This repository builds its static site into `dist/`. The pinned GitHub Actions workflow validates pull requests and deploys `dist/` only after code reaches `main`. **Do not enable Pages until the pull request is merged and the owner details in `TODO-OWNER.md` are supplied and reviewed.** This keeps every placeholder out of the public site.

## Before launch

1. Confirm all `TODO-OWNER.md` items are complete, especially the legal developer/business name, monitored privacy/support email, privacy effective date, and any required EU trader disclosures.
2. Review all claims, policy text, media rights, accessibility, store availability, and the final site screenshots. The current release is not available and no browser-playable demo exists.
3. Merge the approved pull request only after the owner details have been added and checked.
4. In **Settings → Pages**, set the source to **GitHub Actions**. The workflow already builds and uploads `dist/` on a push to `main`; its deploy job stays skipped until the repository variable `PAGES_DEPLOY_ENABLED` is set to `true`. Do not select a branch-folder publishing source.
5. Set repository variable `PAGES_DEPLOY_ENABLED=true` only after the owner details are complete, the pull request is merged, and Pages is configured. This deliberate second gate prevents an accidental public deploy when the code is merged before launch details are ready.
6. Verify `github-pages` environment permissions and the public repository's Actions policy allow the pinned Pages actions. The workflow grants only `contents: read` to the build job and `pages: write` / `id-token: write` to deployment.
7. Open the published `https://kayis-rahman.github.io/ironveil-site/` URL. Check Home, How to Play, Demo & Media, Release, Privacy, Support and 404; test AVIF/WebP images, navigation, reduced motion, desktop/mobile layout, `robots.txt` and `sitemap.xml`.

## Local validation and preview

```sh
npm ci
npm test
python3 -m http.server 8000 --directory dist
```

The build can be configured with `SITE_URL` when the final public location changes. Internal URLs remain relative; the sitemap, robots sitemap pointer and Open Graph share image use the configured public URL.

If the GitHub Actions policy prevents this workflow from running, do not enable Pages or silently switch publishing sources. First resolve the repository Actions policy. Only if Actions truly cannot run, propose the `docs/`-folder publishing alternative to the owner and keep the same owner-details gate; do not maintain two deployment sources simultaneously.

## Later custom domain

Only after a domain is chosen and the owner approves it: configure DNS to the exact values GitHub Pages shows, add the domain under **Settings → Pages**, verify DNS and HTTPS, then set `SITE_URL` to the final HTTPS site URL and update the workflow/release process as appropriate. Do not add a `CNAME` file until the domain is configured. Recheck the sitemap, robots pointer, social metadata, HTTPS and redirects after propagation.
