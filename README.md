# thapp.pro

Landing page and support pages for the TrainHub app. Plain static files served by GitHub Pages.

## Landing page

The landing page exists in four languages: `/` (English), `/pl/`, `/uk/` and `/es/`. These `index.html` files are generated, so don't edit them by hand.

- Layout: `src/landing.template.html`
- Copy: `i18n/<lang>.json` (every file needs the same keys)
- Styles and behaviour: `styles.css`, `script.js`

After changing any of these, rebuild and commit the output:

```bash
node scripts/build.mjs
```

The build also writes `sitemap.xml`. CI runs the same script and fails if the committed pages are out of date.

### Screenshots

Put phone screenshots in `images/screens/` as `<name>.jpg`, `<name>.png` and/or `<name>.webp` (430×932 ratio). Names: `dashboard`, `workout`, `session`, `nutrition`, `agent`, `progress`, `highlights`, `clients`, `story`, `story2`. A missing screenshot renders as a placeholder. Rebuild after adding one.

### Shared profile links

`https://thapp.pro/?u=<userId>` shows an invite card that opens `trainhub://user/<userId>`. With the app installed, iOS and Android open these links directly through `.well-known/`.

## Preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Pushing to `main` deploys through `.github/workflows/deploy.yml`. In the repo settings, set Pages → Source to **GitHub Actions**.
