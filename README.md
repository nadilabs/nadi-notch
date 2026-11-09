# Nadi — GitHub Pages (static site)

Prepared for **GitHub Pages → Deploy from a branch**, without Python, npm, Vite, or CI builds. This package contains the independently implemented Nadi V3 landing page. It **is not a 1:1 copy of Nusa**, and includes no Nusa source code.

## Recommended: use a dedicated public repository

1. Create a new public GitHub repository, e.g. `nadi-website`, in your preferred GitHub account. This keeps the private Rust/Windows application repository separate from the public website.
2. Extract the contents of this ZIP **to the root** of that repository. Keep `index.html`, `css/`, `js/`, `assets/` at repository root; do not put the outer ZIP folder into the repository.
3. Commit and push to `main`.
4. Open **Settings → Pages → Build and deployment**. Set **Source: Deploy from a branch**, **Branch: main**, **Folder: /(root)**, then **Save**.
5. The site URL is usually `https://<account>.github.io/<repository>/` until you configure a custom domain.

Do not expect a site to appear before deployment has completed. See GitHub Actions / Pages build history for any error.

## Configuration

- `js/config.js`: releaseUrl, supportUrl, feedbackUrl. They deliberately default to empty; never insert unverified links.
- Paths are relative (`./css/`, `./js/`, `./assets/`) to work with project sites under `/<repo>/`.
- `CNAME` is **not** included, because the custom domain has not been verified or configured. If using `nadispacelabs.com`, configure the domain and DNS following official GitHub Pages instructions before adding `CNAME`.
- Nadi's native screenshots are packaged as `assets/previews/*.png`; these are website previews, not a running Rust UI.

## Want Pages within the existing Nadi app repository?

Use a dedicated `gh-pages` branch containing **only the contents** of this ZIP at the root. Then in Settings → Pages choose **Deploy from a branch → gh-pages → /(root)**. Do not overwrite the app's `docs/` folder; it already contains project documentation.

**GitHub Free limitation:** Pages publishing from a private repository is only available with qualifying paid GitHub plans. A dedicated **public website repository** works on GitHub Free and avoids making the private Rust app public. GitHub Pages sites are publicly reachable even when the underlying repository is private on supported plans.

## Source rights

The Nusa repository currently has no reuse license. Its source cannot be republished verbatim as Nadi without the author's permission. This static website uses its own code and Nadi-owned assets rather than distributing the Nusa implementation.
