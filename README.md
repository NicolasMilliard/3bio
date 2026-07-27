# 3bio

An open-source link in bio editor for Lens profiles.

## Cloudflare Pages

Create a Pages project from this repository with the following settings:

- Production branch: `main`
- Framework preset: React (Vite)
- Build command: `bun run build`
- Build output directory: `dist`
- Root directory: repository root (leave blank)
- Environment variable: `BUN_VERSION=1.3.13`

Leave `VITE_PUBLIC_ORIGIN` unset while using the temporary `pages.dev` domain.
The app will use the current browser origin for links and canonical URLs. After
connecting the custom domain, set `VITE_PUBLIC_ORIGIN` to its HTTPS origin and
redeploy.

Cloudflare Pages automatically applies the SPA fallback because the build does
not contain a top-level `404.html`. The rules in `public/_headers` keep preview
domains out of search results and apply production security and caching headers.
No Wrangler configuration is required for this static, Git-integrated Pages
deployment.

## License

3bio's source code and original project assets are available under the
[MIT License](./LICENSE). That license does not grant rights to user-generated
content, Lens profile content, or third-party names and trademarks.
