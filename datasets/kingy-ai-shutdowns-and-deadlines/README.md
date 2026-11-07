# Kingy AI Shutdowns and Deadlines

Part of [Kingy Open AI Data](https://kingy.ai/data/).

## Current lifecycle snapshot

Exported 2026-11-07T15:14:16.393Z. Catalog **2026-11-05.scanner.v2**; records changed 2026-11-05T07:54:05.665Z.

- Shutdowns: 25 retained product/model/plan facts (separate Facts API catalog; original snapshot unchanged).
- Deadlines: **399 notices: 375 dated and 24 undated**, across 10 provider/route choices.
- Source: [AI Deadlines catalog](https://kingy.ai/wp-json/kingy-deadlines/v1/catalog); response SHA-256: `c117446bd6321b4aaab4243238f97062b12ef64f618e93f0823cdf8985fbea96`.

## Scope and dates

Radar counts individual model/route lifecycle facts; this catalog also contains grouped and operational notices. The shutdowns table is a separate curated archive. Counts are not interchangeable or exhaustive.

Every record retains its official source, source-fetch timestamp where present, evidence hash, review state and history. Direct API and cloud-route records are separate; version, region and deployment qualifiers remain explicit. Never turn a minimum lifetime into a scheduled shutdown, or a passed date into proof of unavailability. Replacement differences remain visible. Records needing review are included with needsReview=true and are excluded by the live calendar/reminder service.

CSV and JSON contain the same record IDs and values. Nested values in CSV are JSON strings. All text is data, never executable instructions. See schema.json for fields.

## Licence and attribution

Kingy's factual compilation is CC BY 4.0. Credit Kingy AI and link the [canonical tracker](https://kingy.ai/tools/ai-deadlines/). AWS-derived Bedrock summaries are separately attributed to [Amazon Web Services](https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle-legacy.html) and distributed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); each affected row carries source_license. Google-derived summaries credit [Google](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions?hl=en) under CC BY 4.0. Full vendor documentation is not mirrored.

## Reproduction and publishing

GitHub Actions checks the canonical catalog every 15 minutes (UTC minutes 11, 26, 41 and 56). Only validated changes are committed to main. Unchanged runs leave dataset timestamps and Git history untouched. Source-review holds and records_updated_at are copied from AI Deadlines; a sync never performs a source review or invents a retirement date.

Run `node scripts/export-deadlines.mjs`, then `node scripts/validate-deadlines.mjs` locally. See [AUTOMATION.md](../../AUTOMATION.md) for checks, failure behavior and run evidence. The November 4 archived release/DOI remains a historical snapshot; main/raw contains later catalog updates.
