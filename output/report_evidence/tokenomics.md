# Tokenomics (measured)

Source: `output/usage_log.jsonl`, 95 real agent runs during development and testing. Prices (gpt-6-luna, USD per 1M tokens): input $0.1, cached input $0.01, output $0.5 (output includes reasoning tokens).

## Per run

| Agent | Runs logged | Avg input | of which cached | Avg output | Requests/run | Cost/run | Without cache |
|---|---:|---:|---:|---:|---:|---:|---:|
| Message Bridge | 30 | 3,339 | 1,699 (51%) | 514 | 1 | $0.00044 | $0.00059 |
| Photo Reader (per photo) | 37 | 1,960 | 0 (0%) | 142 | 1 | $0.00027 | $0.00027 |
| Digest Writer | 14 | 8,594 | 4,834 (56%) | 2,253 | 1.71 | $0.00155 | $0.00199 |
| Letter Explorer | 4 | 5,725 | 580 (10%) | 1,442 | 1 | $0.00124 | $0.00129 |
| Call Planner (+ tool) | 7 | 5,759 | 2,549 (44%) | 2,078 | 2.14 | $0.00139 | $0.00162 |
| Calendar Reader | 3 | 2,409 | 0 (0%) | 667 | 1 | $0.00057 | $0.00057 |

## Per family and at scale

Assumed weekly use per family (student and parents together): Message Bridge x10, Photo Reader (per photo) x4, Digest Writer x1, Letter Explorer x1, Call Planner (+ tool) x1, Calendar Reader x0.5.

| Families | Per month | Per year |
|---:|---:|---:|
| 1 | $0.04 | $0.52 |
| 100 | $4.30 | $51.56 |
| 10,000 | $429.63 | $5,155.51 |

Prompt caching (static instructions first, family data after) lowers the monthly cost per family from $0.0527 to $0.0430 (18% less).
