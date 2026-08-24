# Privacy, moderation, and deletion

This document describes what 3bio currently protects, what its profile-owner
controls change, and the limits of deletion. It applies to the hosted project
and to compatible self-hosted forks unless the operator changes these parts.

## Public-page privacy

3bio does not fetch a destination website's favicon when it renders a profile
link. Links use a bundled generic icon, so merely opening a 3bio page does not
contact every linked website. The 3bio site's own favicon remains a same-origin
asset. Clicking a profile link still contacts that destination normally.

Profile-owned images are rendered only from:

- the current 3bio origin;
- the exact production Grove gateway, `https://api.grove.storage`; or
- a temporary `blob:` URL created for a local editor preview.

Images on arbitrary HTTPS hosts are not rendered and fall back to the existing
placeholder. Social-preview metadata follows the same origin policy. The Content
Security Policy adds a second boundary: image requests are limited to self,
editor blobs, and Grove; general media is disabled; and browser connections are
limited to self, the Lens API, the Lens RPC, Grove, and the optional Cloudflare
Insights endpoint. There are no catch-all `https:` or `wss:` connection sources.

Dynamic profile HTML, including a currently public profile, is returned with
`Cache-Control: no-store`. This prevents 3bio and conforming browser or shared
caches from retaining a ready page after a later opt-out, deletion, or
moderation decision. Static assets and generic invalid-route responses retain
their separate caching policies because they do not contain resolved profile
data.

## Profile-owner controls

Profiles without an explicit publication setting remain public for backward
compatibility. A profile owner or manager can make one of these Lens metadata
updates:

- **Hide profile (opt out):** writes an `opted-out` publication state. The
  public URL responds like an unknown profile with HTTP 404, noindex metadata,
  and `no-store`, while the current 3bio settings remain available for a later
  restore.
- **Make profile public:** writes a `public` publication state. If current 3bio
  data was previously deleted, new profile details still need to be added and
  saved.
- **Delete current 3bio data:** replaces the current 3bio payload with a small
  publication-only `deleted` marker. The public page is hidden, and the current
  3bio profile, theme, settings, and tombstones are no longer part of the latest
  composed 3bio state. Native Lens fields and unrelated metadata attributes are
  preserved.

These actions upload a new metadata document and publish its URI through Lens.
They require the connected wallet and Lens session to remain bound to the
selected account. Depending on sponsorship and wallet state, the user may be
asked to switch to Lens mainnet and approve a transaction. Lens indexing can
take time, so the public result may not be visible immediately.

## Grove cleanup

3bio keeps an account-scoped manifest of resources that this installation has
recorded as app-managed. The manifest is stored in `localStorage` for the
current site and browser; it is not a global Grove inventory and does not prove
ownership of arbitrary URLs.

New uploads are recorded as pending immediately. A confirmed save records the
active metadata document and the managed media it references. A definitive
failure before submission can mark uploads as orphaned, but a confirmation
timeout or other ambiguous submission remains protected because 3bio cannot
safely infer whether it became live. This release does not yet reconcile an
ambiguous pending record, so it remains retained indefinitely unless a later
confirmed attempt updates the same record. Saving in the editor does not
automatically delete old uploads.

Before user-triggered cleanup, 3bio loads the latest Lens account metadata and
protects every Grove resource that is still referenced. It attempts to delete
only inactive, locally recorded **image** resources that are no longer
referenced. Pending images remain protected. Grove metadata documents are always
retained because Lens account data does not expose their current source storage
key, so the browser cannot prove that an apparently superseded document is no
longer indexed or could not become current again. Image deletions run
sequentially, are best effort, and may require a wallet message for each image.
Failed or rejected deletions remain recorded so cleanup can be retried.

On browsers with Web Locks, editor saves and privacy actions for the same Lens
account are serialized across same-origin tabs. Cleanup also re-fetches the
expected Lens account and rechecks the local manifest immediately before each
image deletion. Browsers without Web Locks should not edit or clean up the same
account from multiple tabs at once; their local manifest writes can otherwise be
last-write-wins.

Lens publication and Grove deletion are separate systems, so the final reference
check and deletion cannot be one atomic operation. A different device, origin,
application, or account manager could publish a reference during a wallet prompt
after that check. Cleanup remains an explicitly user-triggered, best-effort
operation; avoid changing the same Lens account elsewhere until it finishes.

After a deletion marker is confirmed, 3bio attempts this same cleanup when it
can refresh the Lens account and obtain the bound wallet signer. The separate
cleanup action can retry retained resources later. Deleting current data can
therefore involve one Lens update plus multiple Grove wallet-message prompts.

This means cleanup cannot discover or remove:

- uploads made in another browser, browser profile, or 3bio origin;
- records lost when site storage was cleared;
- uploads made before the manifest existed or by another application;
- Grove resources that are still referenced by the latest Lens metadata;
- pending uploads whose publication result is ambiguous; or
- Grove metadata documents, because their current live key cannot be proven.

The manifest contains the Lens account address, Grove storage keys, resource
kind and state, and local timestamps. Clearing site data removes this local
cleanup record, not the corresponding Grove content.

## Deploy-time moderation

The current moderation mechanism is a static denylist in
`src/constants/profileModeration.ts`. Operators can add normalized Lens handles
or Lens account addresses and redeploy. A denied profile receives the same
generic HTTP 404, noindex, and `no-store` response as a missing or self-hidden
profile. Unsupported future 3bio schemas also fail closed.

This is deliberately a small deployment control. There is no moderation
database, authenticated admin interface, live rule update, report queue, audit
log, or appeals workflow. Denylist entries are committed in source and shipped
with a deployment, so never include private reports, explanations, or other
sensitive data. Every change requires a new build and deployment.

Self-hosters that change media storage or network endpoints must update both the
trusted-media policy in `src/lib/trustedMedia.ts` and the matching CSP in
`public/_headers` and `src/features/profile/edge/htmlResponse.ts`. Tests enforce
that the static and Function response policies remain identical.

## What deletion cannot erase

Opt-out, moderation, and deletion control the current 3bio rendering and the
eligible Grove objects known to the current browser. They do not erase:

- Lens account state, transactions, or other on-chain history;
- historical Lens metadata documents or native Lens profile fields;
- Grove objects that are unknown, still referenced, immutable, or not
  successfully deleted;
- Lens indexer, browser, CDN, search-engine, or social-preview caches that
  already received an older response;
- archives, screenshots, exports, or copies retained by third parties; or
- request records previously collected by sites a user chose to visit.

`no-store` prevents new 3bio profile-page caching; it cannot recall copies made
before the header was received. For an urgent moderation change after an older
deployment, redeploy the denylist and use the hosting provider's cache-purge
controls where available, then request removal from relevant third parties
separately.
