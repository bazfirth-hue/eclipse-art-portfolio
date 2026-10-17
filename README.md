# EclipseArt

James's spray paint portfolio. Plain static site, no build step, no framework.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole page. Every artwork is written here as its own block. |
| `style.css` | All styling. |
| `script.js` | Starfield, nav, reveals, gallery filter, lightbox, contact form. |
| `img/` | Web-sized copies of every photo. **These are what the site loads.** |
| `img/thumb/` | Smaller copies used in the gallery grid. |
| `*.jpg`, `*.png` in the root | The full-size camera masters. Never loaded by the site, kept as the originals. |
| `optimise-images.ps1` | Rebuilds `img/` from the masters. |
| `dev-server.js` | Local preview server. |

## Working on it

Preview it properly with the local server, some things do not behave over `file://`:

```
node dev-server.js
```

then open http://localhost:8123

## Adding a new artwork

1. Drop the photo in the root folder.
2. Add a line to the `$map` table in `optimise-images.ps1`, mapping the filename to a
   short slug, for example `'20260901_120000.jpg' = 'crimson-drift'`.
3. Run `.\optimise-images.ps1`. It writes `img\crimson-drift.jpg` and `img\thumb\crimson-drift.jpg`
   and prints the pixel dimensions of both.
4. Copy any existing `<button class="gallery-item">` block in `index.html`, paste it in the
   gallery, and change the slug, the title, the category, the caption and the `width`/`height`
   numbers to the ones the script printed.
5. Update the count in the gallery footer.

Getting `width` and `height` right matters. The browser uses them to hold the right amount of
space before the image arrives, which stops the page jumping about as it loads.

## Things worth knowing

- **Never edit anything in `img/`.** It is generated. Change the master and re-run the script.
- Re-encoding strips EXIF, so camera GPS data never reaches the website.
- The lightbox reads its content from the `data-` attributes on each gallery button.
  `data-size` and `data-status` are deliberately empty, and anything empty is simply not shown,
  so filling them in is all it takes to display dimensions and availability.
- `img/og-card.jpg` is the image that shows when the site is shared on social media or messaging
  apps. It was generated once from `the-eclipse.jpg`, it is not automatic.

## Still to do

- [ ] **Contact form is not connected.** Sign up free at web3forms.com, and paste the access key
      over `YOUR_WEB3FORMS_ACCESS_KEY` in `index.html`. Until then the form validates but tells
      the visitor it is not connected, and nothing is delivered.
- [ ] **Nine works have placeholder titles** that were written to describe the picture, not by
      James: Cloud City, Neon Skyline, Frozen Capital, Emberfall, Comet Run, Verdant Giant,
      Sister Worlds, Magenta Veil, Starburst. His own titles should replace them.
- [ ] **Sizes and availability.** Fill `data-size` (for example `60 × 40 cm`) and `data-status`
      (for example `Available` or `Sold`) on each work.
- [ ] **Social links.** There is no Instagram or contact email anywhere on the site yet.
- [ ] **`og:url` and canonical.** Need the live address once it is hosted.

## Shop (added 17 Oct 2026)

Originals £200, prints £25, UK delivery included. All prices and Stripe links live in the
`SHOP` block at the top of `script.js`. Paste each Stripe Payment Link into its artwork, and
the single print link into `printLink`. Until a link is filled in, Buy falls back to the
contact form with the piece and price prefilled. `sold: true` marks an original sold and keeps
its print on sale. Card price tags and the Google product data are generated from the same block.
Every piece has its own shareable link: `#art/<image-name>`, e.g. `#art/the-eclipse`.
