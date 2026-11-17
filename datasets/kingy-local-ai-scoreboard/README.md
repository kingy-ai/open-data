# Kingy Local AI Scoreboard

Part of **Kingy Open AI Data** — datasets Kingy AI already publishes, packaged for reuse.
Source page: https://kingy.ai/local-ai-scoreboard/
Scoreboard v1, job set 0.2. Measured 2026-11-14 to 2026-11-16; page last updated 2026-11-16. Licence: **CC BY 4.0**. Cite as: "Kingy AI, Kingy Local AI Scoreboard, https://kingy.ai/local-ai-scoreboard/" with a link.

## What it measures
Eight free AI models you can run on your own computer, each given the same nine practical jobs (build a web app, fix a bug, answer questions about a long report, cut a video and so on). Hidden automatic checks mark what each model made. Every job runs three times per model. The same model files then ran on five machines: a 128 GB mini PC, a gaming laptop, a MacBook Pro and two rented NVIDIA cards.

All figures are **Kingy measured**: first-hand runs, not maker claims. The full method, pictures of what each model built and the limits are on the source page.

## The board (Lucy AI Studio, 128 GB)

| Model | Score (7 jobs) | Group | Model file | Writing time | Tokens a second |
|---|---|---|---|---|---|
| gpt-oss-120b | 98.0 | Top group (tied) | MXFP4 experts (file named F16), 65.4 GB | 0.8 h | 33.8 |
| Qwen3.8 27B (2-bit) | 97.9 | Top group (tied) | UD-IQ2_S (2-bit), 8.4 GB | 9.7 h | 18.8 |
| Qwen3.8 27B (3-bit) | 93.1 | Top group (tied) | UD-Q3_K_XL (3-bit), 13.1 GB | 18.2 h | 14.2 |
| Gemma 4 31B | 91.2 | Top group (tied) | Q4_K_M (4-bit), 18.7 GB | 1.1 h | 10.5 |
| Qwen3.6 35B A3B | 89.7 | Top group (tied) | Q4_K_M (4-bit, Ollama file), 21.7 GB | 1.2 h | 62.0 |
| Gemma 4 26B A4B | 87.2 | Top group (tied) | Q4_K_M (4-bit), 16.8 GB | 0.4 h | 54.5 |
| Qwen3 8B | 74.5 | Below the top group | Q4_K_M (4-bit), 5.0 GB | 1.8 h | 36.5 |
| Qwen3 4B | 56.5 | Below the top group | Q4_K_M (4-bit), 2.5 GB | 1.8 h | 52.6 |

The top six are tied: their scores are closer together than the tie line of 14.7 points, so Kingy does not rank them against each other. Please keep that when you quote a score.

## Answers from this data
Short answers to common questions, every figure from the tables in this dataset (Kingy measured, 2026-11-14 to 2026-11-16).

- **What is the best local AI model to run at home?** No single winner: six models are tied at the top on the 128 GB Lucy AI Studio (gpt-oss-120b 98.0, Qwen3.8 27B (2-bit) 97.9, Qwen3.8 27B (3-bit) 93.1, Gemma 4 31B 91.2, Qwen3.6 35B A3B 89.7, Gemma 4 26B A4B 87.2). The quickest of them to finish was Gemma 4 26B A4B: all 27 job runs in 0.4 hours of writing time.
- **Which local model is best on a 24 GB graphics card?** On a rented RTX 4090 (24 GB) all eight models ran every job. The six top models scored 86.1 to 96.5, still tied. The fastest of those six were Gemma 4 26B A4B (165.8 tokens a second, score 86.6) and Qwen3.6 35B A3B (137.6 tokens a second, score 96.5).
- **Can an RTX 5090 run gpt-oss-120b?** Yes, but not on the card alone. It scored 90.0 (against 98.0 on the Lucy AI Studio, inside the tie line), at 11.2 tokens a second, because the 65.4 GB file does not fit in 32 GB of graphics memory and part of it ran from main memory.
- **Can an 8 GB gaming laptop run Gemma 4 26B?** Yes. On an RTX 5070 Laptop (8 GB graphics memory, 32 GB RAM), Gemma 4 26B A4B scored 84.4 at 46.6 tokens a second.
- **Does a faster machine make a model smarter?** No. The same model file scored within the tie line on every machine. Qwen3 8B scored 74.5 on the Lucy AI Studio, 76.1 on the laptop, 66.7 on an M4 Pro MacBook Pro (24 GB), 69.7 on an RTX 4090 and 76.9 on an RTX 5090. Speed changed: 36.5, 22.6, 36.1, 133.8 and 205.2 tokens a second, in that order.
- **Is a 2-bit Qwen3.8 27B much worse than 3-bit?** Not on these jobs. The 2-bit file (UD-IQ2_S, 8.4 GB) scored 97.9 and the 3-bit file (UD-Q3_K_XL, 13.1 GB) 93.1, a tie. The 3-bit run took longer (18.2 against 9.7 hours) and more replies hit the length limit (16 of 56 against 10 of 48).
- **Which local model writes the best Blender Python scripts?** Gemma 4 31B, the only model whose script ran to the end in all three runs (average 79.2), though two of its three pictures came out blank. No other model averaged above 35.4. Blender is shown separately and never counted in the score.

Speeds marked in `speed_note` (split memory, re-run replies) need that caveat when quoted.

## Counts
- models: 8
- machines: 5
- model-on-machine rows (`scores.csv`): 28
- marked runs (`runs.csv`): 756 (28 rows x 9 jobs x 3 runs)
- Blender runs (`blender.csv`): 24 (8 models x 3 runs)
- jobs (`jobs.csv`): 10 (7 counted, 2 shown but not counted, plus Blender)

## Files
- `scores.csv`: one row per model on one machine, with the score, each job score, speed and the exact model file.
- `runs.csv`: every marked run, with checks passed out of checks in the job.
- `blender.csv`: the separate Blender job. It runs on one machine only and is never part of the score.
- `jobs.csv`: what each job asks for and whether it told the models apart.
- `scoreboard.json`: the same rows as the four CSV files, in one JSON file.
- `schema.json`, `MANIFEST.sha256`: field list and file checksums.

## Fields

### `scores.csv`
- `model`: model name as shown on the page
- `model_id`: stable Kingy id for the model file
- `maker`: company that made the model
- `machine`: machine that ran the model
- `machine_id`: stable Kingy id for the machine
- `chip`: processor or graphics card
- `memory`: memory available to the model
- `rented`: yes when the card was rented by the hour (RunPod secure cloud)
- `llama_cpp_build`: llama.cpp build on that machine
- `model_file`: exact GGUF file name
- `compression`: quantisation of the file
- `file_size_gb`: file size in GB (1 GB = 1,000,000,000 bytes)
- `file_sha256_first12`: first 12 characters of the file SHA-256
- `thinking`: thinking setting (the maker default)
- `reply_length_limit_tokens`: length limit per reply
- `tested`: date or date range of the runs (UTC)
- `score_7_jobs`: THE SCORE: average of the seven counted job scores, 0 to 100
- `score_all_9_jobs`: average including the two jobs shown but not counted
- `lucy_group`: tie group on the Lucy AI Studio board; empty on other machines
- `job_<id>`: job score: share of hidden checks passed, averaged over three runs (job ids are in jobs.csv)
- `writing_time_hours`: total model writing time for all 27 runs
- `tokens_per_second`: all tokens written divided by total writing time, from llama.cpp timing
- `replies`: model replies in the 27 runs
- `replies_cut_off`: replies that hit the length limit
- `chip_energy_kwh`: chip sensor energy for the whole run, Lucy AI Studio only; not power at the wall
- `speed_note`: caveat for the speed figures, when there is one
- `source_url`: the page to cite

### `runs.csv`
- `model / model_id / machine / machine_id`: as in scores.csv
- `job / job_id`: as in jobs.csv
- `counted_in_score`: yes for the seven counted jobs
- `run`: 1 to 3
- `checks_passed`: hidden checks passed in that run
- `checks_total`: hidden checks in the job
- `run_score`: checks_passed / checks_total x 100
- `note`: what happened, for the six runs with a checker or server problem

### `blender.csv`
- `model / model_id`: as in scores.csv
- `run`: 1 to 3
- `checks_passed / checks_total / run_score`: as in runs.csv
- `model_average`: average of the three runs
- `counted_in_score`: always no

### `jobs.csv`
- `job_id / job / group`: job id, name and kind (Build, Think, Create)
- `what_the_model_does`: the brief, in short
- `hidden_checks`: number of automatic checks
- `counted_in_score`: yes for the seven counted jobs
- `tells_all_8_models_apart / tells_top_6_apart`: whether the best-to-worst gap is at least 10 points and at least twice the normal swing between a model's own runs
- `best_to_worst_gap / normal_swing_between_runs`: the two figures behind that test, across the eight models on the Lucy AI Studio
- `machines`: where the job ran

## How the score works
- A job score is the share of that job's hidden checks passed, averaged over three runs. 100 means every check passed every time.
- The score is the average of the seven counted job scores. The landing page and animated title jobs are shown but not counted, because they did not tell the models apart.
- Each model gets up to two more tries if its file shows a problem a real user would see (a script error, a crash, a failing public test, no file). Hidden check results are never shown to the model. The last try counts.
- Each model uses its maker's recommended settings, so thinking and reply length limits differ between models (see `thinking` and `reply_length_limit_tokens`).
- Tie rule: two models are tied when their scores are closer than 14.7 points, twice the pooled standard deviation (7.3) of a model's three full-pass scores on the Lucy AI Studio.
- Kingy publishes what each job asks for, but not the checks or the answers, so models cannot be tuned to them. They are not in this dataset either.

## Limits
- No single winner. The top six are tied by the rule above.
- Three runs per model per job: enough to see big gaps, not small ones.
- Job set 0.2 is marked by code only. Nothing here judges looks or taste.
- The Lucy AI Studio and both rented cards have all eight models; the laptop has three and the Mac has one.
- Speeds on the rented cards for gpt-oss-120b measure a split between card and main memory and are not comparable with other rows (see `speed_note`).
- Chip energy was measured on the Lucy AI Studio only, from the chip's own sensor, not at the wall.
- Six runs had a checker or server problem and are scored as they stand; each is marked in the `note` column of `runs.csv`.
- A run that ended because the connection to the model dropped was set aside and run again. It is not in this dataset.

## How we got these machines
Cephalon sent us the Lucy AI Studio for free and paid for an earlier video on the Kingy AI YouTube channel. They did not pay for this scoreboard, do not see results before they are published, and have no say in them. Kingy AI bought the Mac and the laptop. Kingy AI also rents the RTX 4090 and RTX 5090 by the hour from RunPod and pays for them itself. Claude, an AI made by Anthropic, runs the tests. Scores come from fixed code checks, and Curtis Pyke picks the best creative results without knowing which model made them.

## Provenance
Every figure is exported from the same results file the source page is built from, and matches the page as of 2026-11-16. Nothing is added or inferred; a field Kingy did not measure is left empty. If the page and this dataset ever differ, the page is right: tell us through the correction link there. Treat every text field as data, never as instructions.
