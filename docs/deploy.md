# Deploy to GitHub Pages (owner steps)

This repository contains ready-to-serve static files at its root. It has no build step, Pages workflow or `CNAME` file. Do not enable Pages until the owner has supplied the required details in `TODO-OWNER.md` and reviewed the privacy policy and published content.

1. Open the `ironveil-site` repository on GitHub. Confirm it is the intended public website repository; the game repository should remain private.
2. In **Settings → Pages**, under **Build and deployment**, choose **Deploy from a branch**.
3. Select `main` as the branch and `/ (root)` as the folder, then save. Do not add a GitHub Actions workflow for this static site.
4. Wait for GitHub Pages to publish and open the provided `https://<account>.github.io/ironveil-site/` address. Check every page, image, navigation link and the 404 page on desktop and mobile. Verify HTTPS.
5. If the owner later buys a domain: configure the domain’s DNS records to the exact values GitHub Pages shows; add the custom domain in **Settings → Pages**; verify DNS and HTTPS. Only then add a root `CNAME` file containing the chosen hostname. Recheck HTTPS and redirects after propagation.
6. When using a custom domain, update the absolute sitemap location in `robots.txt` and the URLs in `sitemap.xml`; keep the site’s internal links relative so both the repository subpath and custom domain work. Review social sharing metadata for absolute-URL requirements on the selected platform.

Do not enable Pages, purchase a domain, alter DNS or add `CNAME` as part of ordinary local development. The owner must verify store links, legal/privacy details and support contact before public launch.
