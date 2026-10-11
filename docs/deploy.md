# Deploy to GitHub Pages

The pinned GitHub Actions workflow validates pull requests and deploys `dist/` automatically on pushes to `main`, once GitHub Pages is configured to use **GitHub Actions**. The site may publish with clearly marked owner details; see [TODO-OWNER.md](../TODO-OWNER.md). The workflow does not merge pull requests. Merging this change requires the captain's explicit authorization.

## Build and preview

The production canonical URL is `https://ironvei-game.online/`. The builder uses this as its default for canonical metadata, Open Graph URLs, the sitemap and the robots sitemap pointer. Internal page links remain relative. To test the GitHub repository URL before DNS is live, run:

```sh
SITE_URL=https://kayis-rahman.github.io/ironveil-site/ npm test
```

The root `CNAME` file contains `ironvei-game.online` and is copied into the Pages artifact. Do not change it to the `www` hostname. The site's internal links continue to work from the GitHub Pages repository path while the custom domain is being set up.

For local preview commands, see [README.md](../README.md).

## Custom-domain setup checklist — firstmate, after the approved merge

The captain purchased **`ironvei-game.online`** at Namecheap. The exact spelling has no `l` after `v`. DNS and the GitHub Pages custom-domain setting have deliberately not been configured in this change; firstmate will handle them as a separate post-merge step.

At Namecheap, the setup will require:

- Apex A records for `@`:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- Optional AAAA records, if firstmate chooses to add IPv6 after checking GitHub Pages' current values.
- A CNAME record for `www` pointing to `kayis-rahman.github.io`.

After DNS propagation, firstmate will set **Settings → Pages → Custom domain** to `ironvei-game.online`, verify GitHub's DNS checks, and enable HTTPS when GitHub makes it available. Then verify the apex and `www` behavior, canonical tags, Open Graph URLs, `robots.txt`, `sitemap.xml`, and the CNAME artifact. Do not configure DNS, the Pages custom-domain setting, or HTTPS as part of this site change.

The Support page is the source for current contact links: GitHub Issues handles general support and bug reports, and its alpha section has a separate request-access email link. The alpha address is not documented as a confirmed monitored privacy or general-support contact.

## Workflow behavior

The workflow grants only `contents: read` to the build job and `pages: write` / `id-token: write` to deployment. Pull requests validate but do not publish. The deploy job runs on pushes to `main`; it has no `PAGES_DEPLOY_ENABLED` gate or manual `workflow_dispatch` trigger. If repository Actions policy prevents the workflow, resolve that policy rather than adding a second publishing source.
