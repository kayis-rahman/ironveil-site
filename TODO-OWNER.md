# Owner tasks before public launch

The site and build are ready for review, not public activation. GitHub Pages must stay disabled until the pull request is merged **and** all owner details below are supplied and verified. The workflow deploys only pushes to `main`; PR validation cannot publish the site.

- [ ] Provide the public display/studio name and legal developer/controller name for the footer and privacy policy.
- [ ] Provide a monitored support/privacy email and a realistic support response expectation.
- [ ] Confirm the privacy-policy controller, effective date, data-practice claims, and hosting disclosure against the final build and applicable law.
- [ ] Decide whether EU trader disclosure applies. If it does, provide the legally required address, registration, VAT or other details and authorize publication.
- [ ] Confirm public platform/device/OS claims, product wording, and that the game remains offline against a bot as described.
- [ ] Confirm that the accepted Freya identity/favicon and existing gameplay captures are cleared for this public site. Existing captures are early-build media, not final store screenshots.
- [ ] Do not publish storyboard stills or the three-second motion study; they remain review-only. If any non-gameplay art or video is proposed later, obtain explicit rights-holder approval before adding it to the site.
- [ ] Add verified TestFlight/App Store URLs, release version/date, requirements and notes only when actual public builds and listings exist.
- [ ] If an optional video is proposed after clearance, review its captions/description needs, privacy behavior, accessibility, download cost and user-initiated playback. Do not add it to the current public build.
- [ ] Review copyright, licenses, product name/trademark, final imagery, privacy/support copy and site screenshots.
- [ ] After the pull request is merged and all details are complete, enable GitHub Pages with **GitHub Actions** as its source. Do not enable Pages with placeholders still present.
- [ ] Decide whether to buy a domain only when ready. Configure DNS and GitHub Pages before adding a `CNAME`; update `SITE_URL`, sitemap/robots and social metadata, then recheck HTTPS and redirects.
