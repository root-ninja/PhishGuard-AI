# PhishGuard-AI

This repository is now cleaned up and Cloudflare Pages friendly from the repo root.

## What changed

- The static app files now exist at the repository root.
- `index.html` is available at the top level, which Cloudflare Pages expects for a static site.
- Unused duplicate files and backup copies were removed to keep the repository simple.

## Cloudflare Pages setup

Use these settings when connecting the GitHub repository to Cloudflare Pages:

- Framework preset: `None`
- Production branch: `main`
- Build command: `exit 0`
- Build output directory: `/`
- Root directory: `/`

If you already created the Pages project earlier, open the Cloudflare Pages project settings and make sure the root directory is not pointing to the wrong folder.

## Alternative setup

If you want to deploy directly from the old subfolder instead, use:

- Root directory: `phishguard`
- Build command: `exit 0`
- Build output directory: `/`

## Local preview

From the repository root, run a local server and open the shown URL:

```powershell
python -m http.server 8080
```

Then visit `http://localhost:8080`.
