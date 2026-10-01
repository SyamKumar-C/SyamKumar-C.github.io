# syamkumar-c.github.io

Personal portfolio of **Syam Kumar Chenchugalla**, Java Full Stack Developer.

Live: https://syamkumar-c.github.io/

A static site with plain HTML, CSS and a small amount of vanilla JavaScript. There's no build step and no framework.

## Structure

```
index.html                               All page content
assets/css/styles.css                    Styles (design tokens at the top, in :root)
assets/js/main.js                        Pull-cord theme lamp, mobile nav, reveals, count-up, parallax, live npm version
assets/fonts/                            Self-hosted Inter + JetBrains Mono (latin subset)
assets/img/icons.svg                     SVG sprite: technology icons (Simple Icons, CC0; Devicon, MIT) and UI icons
assets/img/favicon.svg                   Favicon
assets/img/og-image.png                  1200x630 social preview image
assets/Syam-Kumar-Chenchugalla-Resume.pdf  Resume served by the "Download Resume" buttons
.nojekyll                                Serve files as-is on GitHub Pages
```

## Common updates

- **Resume:** replace `assets/Syam-Kumar-Chenchugalla-Resume.pdf` with a new file of the same name.
- **Experience / projects:** edit the matching `<section>` in `index.html`. Each role has a few
  bullets that are always visible and more inside a `<details>` block.
- **Colors / themes:** light theme tokens are on `:root` and dark theme tokens on `[data-theme="dark"]` at the top of `styles.css`.
  Light is the default; a visitor's choice is saved in `localStorage` (`theme`), otherwise the system preference is used.
  The switch is the hanging bulb in the header: drag the cord down and let go to switch (it follows the pointer with rubber-band
  resistance and springs back); a tap or Enter/Space plays the same pull automatically. Switching uses the View Transitions API for a radial reveal from the toggle where supported; other browsers get a
  synchronized cross-fade of the registered colour tokens. Duration and easing are `--theme-dur` / `--theme-ease`.
- **Icons:** reference a symbol with `<svg class="ti"><use href="assets/img/icons.svg#i-java"/></svg>`.
  Add a `t-*` class (e.g. `t-spring`) on a parent to tint icons and badges with that technology's colour.
- **npm version:** this is fetched live from the npm registry. If that request fails, the line stays hidden.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```
