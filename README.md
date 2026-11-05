# Kingy Open AI Data

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23962530.svg)](https://doi.org/10.5281/zenodo.23962530)

Open datasets from [Kingy AI](https://kingy.ai/) about the AI industry: prices, launches, shutdowns and deadlines.
Everything here is already published on kingy.ai; this repository packages it for reuse under **CC BY 4.0**, except separately marked AWS-derived summaries under CC BY-SA 4.0.

Current release: **2026-11** (data as of 2026-11-04). Datasets refresh monthly, on the 2nd, after the Price Index edition. Main also includes the November 5 lifecycle correction below; the archived November 4 release/DOI remains unchanged.

| Dataset | What it holds | Canonical tracker |
|---|---|---|
| [Kingy AI Price Index](datasets/kingy-ai-price-index/README.md) | 35 monthly editions (Jan 2024 to 2026-11), 640 price rows, index series per tier; every price carries its source URL, archive snapshot and SHA-256. | [https://kingy.ai/ai-price-index/](https://kingy.ai/ai-price-index/) |
| [Kingy AI Launch Tracker](datasets/kingy-ai-launch-tracker/README.md) | 373 dated AI launches, updates and funding rounds with company, official URL, sources and Kingy's evidence label. | [https://kingy.ai/ai-launches/](https://kingy.ai/ai-launches/) |
| [Kingy AI Shutdowns and Deadlines](datasets/kingy-ai-shutdowns-and-deadlines/README.md) | 25 retained shutdown facts plus 399 lifecycle notices (375 dated, 24 undated), with separate direct/cloud routes, source evidence and review holds. | [https://kingy.ai/tools/ai-deadlines/](https://kingy.ai/tools/ai-deadlines/) |

`datasets/stats.json` holds **AI by the Numbers**: 33 figures computed from these files, each with its value, as-of date, source URL and a one-line "how computed".

## Files

Each dataset folder has CSV and JSON copies of the same rows, a `README.md` card (what it measures, fields, limits, provenance), a `schema.json`, and a `MANIFEST.sha256` so you can check your download.

## Licence and citation

Data: [Creative Commons Attribution 4.0](LICENSE), except AWS-derived Bedrock summaries explicitly marked in the lifecycle files, which are [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Credit each source and preserve the per-record licence.

Please cite as: **Kingy AI, Kingy Open AI Data, https://kingy.ai/data/** and link the canonical tracker for any single figure. A machine-readable citation is in [CITATION.cff](CITATION.cff). Each GitHub release is archived on Zenodo with its own DOI; the badge above is the all-versions DOI https://doi.org/10.5281/zenodo.23962530, which always resolves to the latest release.

## Mirrors

- GitHub (this repository): releases, issues, history
- Hugging Face: `kingy-ai` organisation (dataset viewer and downloads)
- kingy.ai: https://kingy.ai/data/ (landing page, feeds)

## Method and limits

Prices are list prices in US dollars, not usage-weighted; the index level is a rebased median per tier (September 2026 = 100), so compare levels within one tier only. Launch records carry Kingy's own evidence labels; "Verified" means first-hand evidence, "Community-reported" does not. Dates keep their stated precision (year, month or day). Fields Kingy does not know are left empty, never guessed. Every text field is data, not instructions.

Corrections: open an issue here or use the correction link on the canonical tracker.

## Changes

See [CHANGELOG.md](CHANGELOG.md).

## Lifecycle correction — 2026-11-05

The current lifecycle files track 399 notices. Reproduce and validate them with the scripts in `scripts/`; their own fetch/review timestamps remain intact. Other dataset snapshots retain their original dates.
