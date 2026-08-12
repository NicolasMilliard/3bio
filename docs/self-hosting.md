# Fork and self-host 3bio

This guide covers creating a compatible 3bio fork, rebranding it, and deploying
it with Cloudflare Pages Git integration. It assumes you want to preserve the
current Lens profile format and production routing behavior.

[Back to the README](../README.md)

- [Fork and verify the project](#1-fork-and-verify-the-project)
- [Keep or change metadata compatibility](#2-keep-or-change-metadata-compatibility)
- [Rebrand the fork](#3-rebrand-the-fork)
- [Deploy with Cloudflare Pages](#4-deploy-with-cloudflare-pages)
- [Connect the final domain](#5-connect-the-final-domain)
- [Understand the production routing](#6-understand-the-production-routing)
- [Verify the deployment](#7-verify-the-deployment)
- [Keep the fork updated](#8-keep-the-fork-updated)

## Before you begin

You need:

- A GitHub account for the fork.
- [Git](https://git-scm.com/).
- Bun `1.3.13`.
- A Cloudflare account with access to Pages.
- A browser wallet that owns or manages a Lens profile if you want to test the
  editor.
- `curl` and `grep` for the optional command-line deployment checks.

The application is configured for Lens mainnet. There is no testnet or mock-save
mode: saving through a local or deployed editor can publish a real Lens account
metadata update.

## 1. Fork and verify the project

Fork `NicolasMilliard/3bio` on GitHub, then clone your fork:

```sh
git clone https://github.com/YOUR_GITHUB_USERNAME/3bio.git
cd 3bio
bun install --frozen-lockfile
```

Run the project checks before customizing anything:

```sh
bun test
bun run lint
bun run build
```

Start the local client with:

```sh
bun run dev
```

No `.env` file is required locally. If `VITE_PUBLIC_ORIGIN` is unset, the app
uses the current browser origin. Do not copy `.env.example` unchanged for local
development unless you intentionally want links and client-rendered metadata to
point to `https://3bio.social`.

## 2. Keep or change metadata compatibility

3bio stores its presentation settings inside a JSON Lens account-metadata
attribute named `3bio`. The key is defined in both:

- `src/constants/attributes.ts`
- `functions/[[path]].ts`

Keep this key unchanged if your fork should read and update existing
3bio-compatible profiles. Changing it creates a separate metadata namespace;
existing 3bio settings will not migrate automatically, and both definitions and
their tests must change together.

The editor preserves native Lens fields and non-3bio metadata attributes when it
saves a new metadata document.

## 3. Rebrand the fork

Search every tracked file for the current name, production domain, and
repository owner before deploying:

```sh
git grep -n -E '3bio|3bio\.social|NicolasMilliard'
```

Review each match instead of running a blind replacement. In particular, keep
the `3bio` metadata attribute key and the paired `data-3bio-server-metadata`
markers unless you deliberately update every reader, writer, edge replacement,
and test that relies on them. The original repository URL and MIT copyright
notice should also remain where they provide upstream attribution rather than
product branding.

### Branding checklist

| Area                                                        | Files to review                                                                                                                                           |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package identity                                            | `package.json`, `.env.example`                                                                                                                            |
| Default origin and source link                              | `src/constants/social.ts`                                                                                                                                 |
| Homepage title, description, canonical URL, and social tags | `index.html`, `src/features/homepage/components/HomeDocumentMetadata.tsx`                                                                                 |
| Profile titles, descriptions, and structured metadata       | `src/features/profile/documentMetadata.ts`, `src/features/profile/components/ProfileDocumentMetadata.tsx`                                                 |
| Wordmark and visible product copy                           | `src/components/icons/Logo.tsx`, `src/components/layout/`, `src/features/homepage/`, `src/features/auth/`, `src/features/profile/components/Branding.tsx` |
| Brand assets and colors                                     | `favicon.svg`, `public/og.png`, `src/assets/`, `index.html`, `src/styles/index.css`                                                                       |
| Sitemap and crawler discovery                               | `public/robots.txt`, `public/sitemap.xml`                                                                                                                 |
| Preferred production host                                   | `functions/[[path]].ts`                                                                                                                                   |
| Pasted profile URL normalization                            | `src/features/homepage/schema/profileCheckingForm.schema.ts`                                                                                              |

`VITE_PUBLIC_ORIGIN` does not replace the raw homepage metadata. The homepage is
served as a static file, so a fork must explicitly update the hardcoded
canonical and social-image URLs in `index.html`, plus the origins in
`public/robots.txt` and `public/sitemap.xml`.

The edge Function currently canonicalizes the original `www.3bio.social` and
`3bio.social` hosts to `https://3bio.social`. Other hosts use the incoming
request origin. If your fork supports both `www` and an apex domain, update
`getPublicOrigin` in `functions/[[path]].ts` to choose one canonical host.

After rebranding, run the complete checks again before deploying:

```sh
bun test
bun run lint
bun run build
```

## 4. Deploy with Cloudflare Pages

Create a Cloudflare Pages project from your GitHub fork with these settings:

| Setting                    | Value                         |
| -------------------------- | ----------------------------- |
| Production branch          | `main`                        |
| Framework preset           | React (Vite)                  |
| Build command              | `bun run build`               |
| Build output directory     | `dist`                        |
| Root directory             | Repository root (leave blank) |
| Build environment variable | `BUN_VERSION=1.3.13`          |

For the temporary `pages.dev` deployment, leave `VITE_PUBLIC_ORIGIN` unset.
Client-rendered URLs and Function-generated profile metadata will use the
current request or browser origin, and the included headers keep preview
deployments out of search results. The raw homepage HTML still contains the
static origin committed in `index.html`.

Cloudflare Pages automatically deploys the root `functions/` directory. This
project does not require a Wrangler configuration, database, API key, or
Cloudflare runtime binding for its current feature set.

Do not add a top-level `404.html` without redesigning the routing setup. The
current deployment relies on Cloudflare Pages' SPA fallback so public profile
and internal app routes can receive the Vite shell before the Function applies
the correct metadata, headers, and status code.

## 5. Connect the final domain

After Cloudflare provisions the temporary deployment:

1. Connect the final custom domain in the Pages dashboard.
2. Add `VITE_PUBLIC_ORIGIN` to Cloudflare's production build environment and set
   it to the HTTPS origin only, for example `https://links.example.com`. This is
   a Vite build-time variable, not a Pages Function runtime secret.
3. Confirm that `index.html`, `public/robots.txt`, `public/sitemap.xml`, and
   `src/constants/social.ts` use the final origin.
4. Review `getPublicOrigin` in `functions/[[path]].ts` if you need apex-to-`www`
   or `www`-to-apex canonicalization.
5. Redeploy the production branch.

Do not include a path in `VITE_PUBLIC_ORIGIN`. The application expects an origin
such as `https://links.example.com`, not `https://links.example.com/profiles`.

## 6. Understand the production routing

The Cloudflare-specific files are part of the application behavior, not just
deployment boilerplate:

- `functions/[[path]].ts` fetches Lens accounts for public handles, injects
  crawler-visible profile metadata, canonicalizes profile URLs, and returns real
  404 or 503 responses when appropriate.
- `public/_routes.json` sends dynamic routes through the Function while keeping
  the homepage and its explicitly listed static assets on the static path.
- `public/_headers` applies security headers, long-lived asset caching, and
  noindex behavior to static responses. Cloudflare does not apply this file to
  Pages Function responses, so `functions/[[path]].ts` sets the corresponding
  headers itself.
- `public/robots.txt` and `public/sitemap.xml` describe the public production
  origin to crawlers.

The exact `/app` path remains available to the Lens handle `app`.
`/app/dashboard` and `/app/edit` are the current internal routes and are served
with noindex headers. Unknown nested paths return a real 404.

If you add another internal route such as `/app/settings`, add its TanStack
route file and let the router plugin regenerate `src/routeTree.gen.ts`; do not
edit the generated file by hand. Update `INTERNAL_APP_PATHS` in
`functions/[[path]].ts`, the relevant noindex rules, and the
routing/social-preview tests at the same time. Otherwise, the edge Function will
treat the unregistered path as not found.

Likewise, when adding a new root asset such as `/manifest.webmanifest` or
`/logo.png`, add it to the exclusions in `public/_routes.json`. Review the
Function's reserved-path list and routing tests as a defensive fallback so the
asset name is never queried as a Lens handle.

`bun run dev` and `bun run preview` run Vite only. They do not execute the
Cloudflare Function, so a generic static host or local preview is not equivalent
to the production deployment. Hosting elsewhere requires an equivalent SPA
fallback and a port of the edge status, metadata, canonicalization, and header
logic.

## 7. Verify the deployment

Replace `https://links.example.com` and `existing-lens-handle` below with real
values from your deployment.

```sh
curl -I https://links.example.com/
curl -I https://links.example.com/existing-lens-handle
curl -I https://links.example.com/a-handle-that-does-not-exist-92841
curl -I https://links.example.com/not/a/route
curl -I https://links.example.com/app/dashboard
```

Confirm the raw homepage uses the fork's final origin:

```sh
curl -s https://links.example.com/ | \
  grep -E "<title|canonical|og:url|og:image"
```

Check the following behavior:

| URL                                      | Expected result                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `/`                                      | HTTP 200 with your canonical homepage and social-image URLs in the raw HTML.                           |
| `/{handle}` for an existing Lens profile | HTTP 200 with profile-specific title, canonical URL, and social tags before JavaScript runs.           |
| A valid but missing handle               | HTTP 404 with `X-Robots-Tag: noindex, nofollow`.                                                       |
| `/not/a/route`                           | HTTP 404 with generic noindex metadata.                                                                |
| `/app/dashboard` and `/app/edit`         | The application shell with `X-Robots-Tag: noindex, nofollow`.                                          |
| `/app`                                   | The public Lens profile for the handle `app`, or a profile-specific 404 if that handle does not exist. |
| A `pages.dev` preview URL                | `X-Robots-Tag: noindex, nofollow`.                                                                     |

Inspect the crawler-visible HTML rather than relying only on the hydrated
browser page:

```sh
curl -s https://links.example.com/existing-lens-handle | \
  grep -E "<title|canonical|og:title|robots"
```

Finally, connect a wallet, choose a Lens profile, make a harmless edit, save it,
and confirm the change on that profile's public handle page.

## 8. Keep the fork updated

Add the original repository as an upstream remote:

```sh
git remote add upstream https://github.com/NicolasMilliard/3bio.git
git fetch upstream
git switch main
git merge upstream/main
```

Resolve branding and deployment-file conflicts carefully when upstream changes
touch files you customized.

## License and attribution

The project is MIT-licensed. Keep the original copyright and permission notice
when redistributing substantial portions of the software. A fork may add its own
copyright notice, but should not remove the original license grant.

The software license does not grant rights to user-generated content, Lens
profile content, or third-party names and trademarks.
