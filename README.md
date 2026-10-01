# syamkumar-c.github.io

Personal portfolio of **Syam Kumar Chenchugalla**, Java Full Stack Developer.

Live: https://syamkumar-c.github.io/

A static site with plain HTML, CSS and a small amount of vanilla JavaScript. There's no build step and no framework.

## Structure

```
index.html                               All page content
assets/css/styles.css                    Styles (design tokens at the top, in :root)
assets/js/main.js                        Mobile nav, scroll reveal, active link, live npm version
assets/fonts/                            Self-hosted Inter + JetBrains Mono (latin subset)
assets/img/favicon.svg                   Favicon
assets/img/og-image.png                  1200x630 social preview image
assets/Syam-Kumar-Chenchugalla-Resume.pdf  Resume served by the "Download Resume" buttons
.nojekyll                                Serve files as-is on GitHub Pages
```

## Common updates

- **Resume:** replace `assets/Syam-Kumar-Chenchugalla-Resume.pdf` with a new file of the same name.
- **Experience / projects:** edit the matching `<section>` in `index.html`. Each role has a few
  bullets that are always visible and more inside a `<details>` block.
- **Accent color:** change `--accent` (and `--accent-strong`, `--accent-soft`, `--accent-line`) in `styles.css`.
- **npm version:** this is fetched live from the npm registry. If that request fails, the line stays hidden.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```
