# Wallet analytics

Optional wallet analytics answers a small alpha-stage question: how many
distinct wallets have connected to 3bio, and how many were seen recently? It
uses one Cloudflare Pages Function and one D1 table. Read the numbers in
Cloudflare's D1 console; there is no admin UI or public read API.

[Back to the README](../README.md)

## What is counted

When enabled, `/app/dashboard` and `/app/edit` submit the connected wallet on
manual connection, automatic restoration on a new visit, or address switch. This
happens before Lens login, so a wallet does not need to select a Lens profile or
save a page to count. Public-page viewers are not counted.

The browser sends `POST /api/analytics/wallet` with JSON:

```json
{ "wallet_address": "0x1111111111111111111111111111111111111111" }
```

The Function inserts or updates one `wallet_usage` row:

| Column           | Meaning                                                 |
| ---------------- | ------------------------------------------------------- |
| `wallet_address` | Lowercase EVM address; primary key prevents duplicates. |
| `created_at`     | First successful submission, as an ISO UTC timestamp.   |
| `updated_at`     | Latest successful submission, as an ISO UTC timestamp.  |

Timestamps come from the server. Subsequent submissions preserve `created_at`
and update `updated_at`. There are no events, heartbeats, or continuous activity
tracking. An open tab does not keep updating the latest-seen time. The feature
stores no cookies, IP addresses, or user agents.

Analytics failures do not interrupt connecting a wallet or using the app. A
failed submission is not retried until another connection or visit, so these
counts may miss wallets. The endpoint checks the method, JSON content, bounded
body size, address format, and same-origin `Origin` header. It does not verify
wallet ownership: someone can forge submissions, and one person can use several
wallets. Report **connected wallets**, rather than verified users. Keeping only
the latest timestamp also means historical monthly activity cannot be rebuilt.

## Enable on Cloudflare Pages

Analytics is disabled by default. The existing app still works without a
database. No Wrangler dependency or separate backend deployment is required.

1. Create a D1 database named `3bio-analytics` in the Cloudflare dashboard.
2. Open that database's console and execute the SQL from
   [`migrations/0001_wallet_usage.sql`](../migrations/0001_wallet_usage.sql).
3. From the Cloudflare account sidebar, open **Compute → Workers & Pages** and
   select the **3bio** Pages application. Open **Settings**, set **Choose
   Environment** to **Production**, then scroll to **Bindings** and click
   **Add**. Choose **D1 database**, set the variable name to
   `WALLET_ANALYTICS_DB`, and select `3bio-analytics`.
4. Add `VITE_WALLET_ANALYTICS_ENABLED=true` to the **Production build**
   environment. This flag is compiled into the client; it is not a secret.
5. Redeploy production so the binding and build flag take effect.

Cloudflare documents the binding setup in
[Pages Functions: D1 databases](https://developers.cloudflare.com/pages/functions/bindings/#d1-databases).
Leave the flag unset or `false` in **Preview** and do not bind the production
database there. Regular `bun run dev` uses Vite without Pages Functions and does
not collect wallet analytics.

The build flag controls browser submissions. Without `WALLET_ANALYTICS_DB`, the
endpoint returns `204` without storing data. To stop collection, disable the
build flag, remove the runtime binding, and redeploy; existing D1 records
remain.

D1 has a free allowance that should accommodate a small alpha. Check the current
[D1 pricing and limits](https://developers.cloudflare.com/d1/platform/pricing/)
as usage grows.

## Read the numbers

Run these queries in the D1 console.

Lifetime distinct connected wallets, since analytics was enabled and excluding
any records that were deleted:

```sql
SELECT COUNT(*) AS connected_wallets
FROM wallet_usage;
```

Wallets seen in the last 30 days:

```sql
SELECT COUNT(*) AS wallets_seen_last_30_days
FROM wallet_usage
WHERE updated_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days');
```

A useful description is: “X wallets have connected; Y were seen in the last 30
days.” The second number is a current rolling window, not historical MAU.

Exclude your own test wallets when reporting by adding a `WHERE` clause (or
`AND` to the recent-wallet query). Replace the example with your lowercase
addresses:

```sql
SELECT COUNT(*) AS connected_wallets_excluding_tests
FROM wallet_usage
WHERE wallet_address NOT IN (
  '0x1111111111111111111111111111111111111111'
);
```

This filters the report only; it does not permanently exclude those wallets from
collection.

## Verify and remove a record

After deploying, connect a test wallet on the dashboard and inspect its row in
D1. Reload the page with that wallet restored: the row count and `created_at`
should stay the same while `updated_at` advances. Switching to another wallet
should create a second row. Check that a Preview deployment does not write to
production D1.

Records have no automatic expiry. To remove a specific wallet, run this in the
D1 console with its lowercase address:

```sql
DELETE FROM wallet_usage
WHERE wallet_address = '0x1111111111111111111111111111111111111111';
```

A later connection can recreate the row with a new `created_at`. Hiding or
deleting a Lens profile through 3bio does not remove this separate record. See
[Privacy, moderation, and deletion](./privacy-moderation.md).
