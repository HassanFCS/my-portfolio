# Portfolio – Ibn e Hassan

Static personal site for a Senior Backend Engineer. Plain HTML, CSS and a little vanilla JavaScript, no framework and no runtime dependencies.

## How content works

`index.html` is **generated**. The single source of truth for everything on the page (name, headline, contact, summary, experience, projects, skills, education, certifications) is the master CV data file:

```
../cv/master/data.js
```

That file lives outside this repository, in the CV folder next to it on the machine where the site is built. This repository holds the generated output, so a fresh clone can be deployed as-is but can only be rebuilt with the `cv/` folder beside it.

`build.js` reads that file, renders `index.html`, copies the CV PDF to `assets/Ibn_e_Hassan_CV.pdf` (the "Download CV" button) and writes `favicon.svg`. Edit the CV data, rebuild, and the site and CV stay in sync. Do not edit `index.html` by hand.

```bash
cd portfolio
node build.js
```

Set `SITE_URL` to your final domain so the canonical URL, Open Graph and JSON-LD links are correct:

```bash
SITE_URL=https://hassanfcs.github.io/my-portfolio node build.js
```

## Run locally

Any static file server works:

```bash
cd portfolio
python3 -m http.server 8080
```

Then open <http://localhost:8080>. (Opening `index.html` directly from the file system also works.)

## Files

| File | Purpose |
| --- | --- |
| `build.js` | Generates the site from `../cv/master/data.js` |
| `index.html` | Generated page (commit it; hosts serve it as-is) |
| `styles.css` | All styling, light and dark themes via CSS variables |
| `main.js` | Theme toggle, mobile menu, scroll-spy, reveal animations |
| `favicon.svg` | Generated favicon with initials |
| `assets/Ibn_e_Hassan_CV.pdf` | CV served by the Download button (copied by the build) |
| `assets/og.jpg` | Link-preview image (1200×630) |

## Deploy

The output is static, so any static host works. Deploy the contents of this `portfolio/` folder.

**GitHub Pages** (current deployment: <https://hassanfcs.github.io/my-portfolio/>)
1. This folder is the root of the `HassanFCS/my-portfolio` repository.
2. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Rebuild with `SITE_URL=https://hassanfcs.github.io/my-portfolio node build.js` before pushing so meta tags point at the live URL. All asset links are relative, so the site also works at a custom domain or a user-site URL after a rebuild.

**Netlify**: drag-and-drop the folder in the Netlify UI, or connect the repo with publish directory `portfolio` and no build command.

**Vercel**: `vercel --prod` from this folder, or import the repo with framework preset *Other* and output directory `portfolio`.

If you add a custom domain, rerun the build with the new `SITE_URL`.

## Theme

Colours live in CSS custom properties at the top of `styles.css`. The site follows the system colour scheme and the header toggle overrides it (saved in `localStorage`). Change `--accent` and `--accent-2` to re-skin.
