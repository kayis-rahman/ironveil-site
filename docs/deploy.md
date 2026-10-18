# Deploy to GitHub Pages

The pinned GitHub Actions workflow validates pull requests and deploys `dist/` automatically on pushes to `main`, once GitHub Pages is configured to use **GitHub Actions**. The site may publish with clearly marked owner details; see [TODO-OWNER.md](../TODO-OWNER.md). The workflow does not merge pull requests. Merging this change requires the captain's explicit authorization.

## Build and preview

The production canonical URL is `https://ironvei-game.online/`. The builder uses this as its default for canonical metadata, Open Graph URLs, the sitemap and the robots sitemap pointer. Internal page links remain relative. To test the GitHub repository URL before DNS is live, run:

```sh
SITE_URL=https://kayis-rahman.github.io/ironveil-site/ npm test
```

The root `CNAME` file contains `ironvei-game.online` and is copied into the Pages artifact. Do not change it to the `www` hostname. The site's internal links continue to work from the GitHub Pages repository path while the custom domain is being set up.

For local preview commands, see [README.md](../README.md).

## Observed GitHub Pages configuration - observed 2026-10-18

The captain purchased **`ironvei-game.online`** at Namecheap. The exact spelling has no `l` after `v`. The following is the observed state from the GitHub Pages API on 2026-10-18, reported for accuracy only - this site change does not alter any of it:

- Custom domain (CNAME): `ironvei-game.online`, configured. GitHub reports the site base as `http://ironvei-game.online/`.
- Source: the GitHub Actions workflow (`build_type: workflow`), branch `main`, path `/`.
- TLS certificate: approved for `ironvei-game.online` and `www.ironvei-game.online`, expiring 2027-01-09.
- HTTPS enforcement: **not enabled** (`https_enforced=false`); HTTP currently answers. Enabling "Enforce HTTPS" is a separate settings step for firstmate/the captain after the approved merge.

DNS records already in place at Namecheap:

- Apex A records for `@`:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- A CNAME record for `www` pointing to `kayis-rahman.github.io`.

Do not configure DNS, the Pages custom-domain setting, or HTTPS as part of this site change. After an approved merge, firstmate should re-verify the apex and `www` behavior, canonical tags, Open Graph URLs, `robots.txt`, `sitemap.xml` and the CNAME artifact.

The Support page is the source for current contact links: general support, bug reports and alpha-access requests all use this repository's public GitHub Issues page (`https://github.com/kayis-rahman/ironveil-site/issues`). No email address is published; the Support page keeps a marked owner slot for a support email address (the captain's decision), and the Privacy page keeps a marked owner placeholder for a private privacy contact.

## Workflow behavior

The workflow grants only `contents: read` to the build job and `pages: write` / `id-token: write` to deployment. Pull requests validate but do not publish. The deploy job runs on pushes to `main`; it has no `PAGES_DEPLOY_ENABLED` gate or manual `workflow_dispatch` trigger. If repository Actions policy prevents the workflow, resolve that policy rather than adding a second publishing source.
