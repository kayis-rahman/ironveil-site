# Display-name art updates

These gameplay captures visibly contain character names or labels. As of 2026-11-14 the landing page and the Demo page display the renamed play-listing captures (`assets/source/gameplay/spectate-start.png`, `spectate-first-strike.png`, `spectate-winter.png`, `spectate-game-over.png`, sourced from `ironveil/docs/release/play-listing-assets-v1/phone-screenshots/spectate-release-pace/`). Those still show in-game character labels and deity names in the HUD, so the game-side capture art needs a further update pass once naming is cleared. The older site captures below are retained but no longer displayed. Do not rename the files or change their URLs.

- `assets/source/gameplay/deity-select.webp` - no longer displayed; the capture contains character names and rival-selection labels.
- `assets/source/gameplay/island.webp` - no longer displayed; the capture contains a previous character label and combat message; it was also the former source of the shared social preview, which is now composed in `scripts/build.mjs`.
- `assets/source/gameplay/island-phone.webp` - not displayed; visible Freya character label.
- `assets/source/gameplay/winter-island.webp` - no longer displayed; character name and character label.
- `assets/source/gameplay/result-win.webp` - not displayed; old character names in the result sentence and labels.
- `assets/source/gameplay/spectate-*.png` - displayed on the landing and Demo pages; renamed deity set, with board and HUD labels still visible pending the game-side rename.

Existing capture filenames were not changed; the `spectate-*` files were added as new sources.
