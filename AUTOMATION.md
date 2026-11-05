# AI Deadlines scheduled open-data sync

The [Sync AI Deadlines workflow](https://github.com/kingy-ai/open-data/actions/workflows/sync-deadlines.yml) checks the existing public [catalog](https://kingy.ai/wp-json/kingy-deadlines/v1/catalog) every 15 minutes, at UTC minutes **11, 26, 41 and 56**. GitHub may delay scheduled jobs. A manual `workflow_dispatch` is also available. This mirrors the reviewed catalog; it does not crawl vendor sources or update WordPress.

## Publication

Tests run first. The sync fetches one bounded HTTPS JSON response and validates its freshness, source record-change clock, IDs, provider/route separation and review state. It exports JSON/CSV, calculates lifecycle statistics, and validates every CSV value and all six dataset checksums. The separate shutdown archive and other dataset observations are preserved.

Only a changed catalog projection is published. A server clock change alone does not produce a commit. The exporter carries a content digest covering records, provider definitions, catalog version and derived lifecycle figures. On unchanged runs, even exported_at and checksums remain untouched. Each run logs a receipt and a GitHub job summary with its decision, counts, source fetch time, held/undated counts and record-change clock.

All changed files are written in **one Git commit**. The publisher checks that main is still the tested parent and performs an ordinary, non-forced ref update. A concurrent maintainer change causes a failure rather than an overwrite. After publishing it reads the raw snapshot back and checks its hash.

The publish allowlist is root README.md, datasets/stats.json, and the lifecycle folder's README.md, deadlines.json, deadlines.csv, schema.json and MANIFEST.sha256. Code, workflows, other datasets, tags and archived release assets are outside the allowlist.

## Source reviews and dates

- needsReview, sourceCurrent, reviewReason, replacementConflict, manual review expiry, sources, evidence and check timestamps are copied from AI Deadlines.
- Held records remain in both data formats. Held dates are excluded from next_deadlines statistics. The sync does not clear a hold or count a fetch of the catalog as a review of its vendor sources.
- records_updated_at comes from the catalog's recordsUpdatedAt. Checked/evidence updates can produce a new export while leaving that clock unchanged. A factual change without a new source record-change date fails validation.
- A source response with a regressed/future record-change date, stale response, omitted IDs, invalid dates, absent cloud routes or contradictory review flags fails before publication.
- Minimum-lifetime and withdrawn-retirement notices retain null dates. An elapsed date never changes confirmedRetired, service availability, replacement or behavior in this exporter.
- A format/contract migration can produce one new export without changing the source record-change clock.

## Access and failure behavior

The validation job has contents: read. Only the main-branch scheduled/manual sync job requests contents: write, using the repository's temporary GITHUB_TOKEN; the token is exposed only to the publishing step explicitly and is not saved in Git configuration. Actions are pinned to full official commit SHAs. There is no personal token or new secret. Pull request runs cannot publish. Runs are serialized; no protection rules are bypassed.

Any fetch, contract, checksum, permission or concurrent-update failure leaves the previous main dataset in place. If the raw readback fails after a successful commit, that commit remains in history and the job fails for inspection; the workflow never force-rolls back somebody else's changes. Inspect the failing Actions step, correct the source/contract or access problem, then use Run workflow or let the next schedule retry.

GitHub automatically disables schedules in public repositories after 60 days without repository activity. Source-check updates normally create activity; maintainers should inspect the Actions page if runs stop. Existing GitHub notification preferences apply; this workflow sends no custom email or opt-in alert.

## Local checks

Use Node 24 and run from the repository root:

```
node --test scripts/deadlines.test.mjs
node scripts/export-deadlines.mjs
node scripts/validate-deadlines.mjs
```

The publisher refuses to run outside the expected repository's main-branch GitHub Actions schedule/manual context. Local export does not publish.
