---
title: "Foundation Model Token Cost Comparison: 14 Amazon Bedrock Models Measured with a Coding-Agent Ralph Loop"
description: Measured report that ran a RealWorld backend implementation task in a Ralph loop five times on each of 14 models in Amazon Bedrock us-east-1 and compares completion, tokens, cost and LLM requests
created: "2026-10-13"
last_update:
  date: 2026-10-14
  author: devfloor9
reading_time: 44
tags:
  - benchmark
  - bedrock
  - coding-agent
  - ralph-loop
  - llm
  - cost
  - agentic-ai
  - scope:tech
sidebar_label: "Report 9. Foundation Model Token Cost Comparison [Measured]"
sidebar_position: 9
category: benchmark
---

import {RalphKpiStrip, RalphModelComparison, RalphCostTimeScatter, RalphMetricMatrix, RalphModelCards, RalphMethodFlow, RalphLineupMap, RalphTokenMix, RalphRoleSplit, RalphGroupCompare, RalphPriceLadder} from '@site/src/components/RalphLoopBenchmark';
import DataTableFrame from '@site/src/components/DataTableFrame';

:::info Reference Benchmark
This benchmark was built with reference to the [Ralph loop completion by model](https://roboco.io/coding-agent-benchmark/) report by Jung Do Hyun (정도현, Roboco).
:::

:::info Measurement Status
**Measured** — 14 models ran five times each on Amazon Bedrock in us-east-1, 70 runs in total, of which 69 completed. The 13 models other than Claude Fable 5.1 ran from 2026-10-12 22:28 to 2026-10-13 00:18 UTC. Claude Fable 5.1 ran separately from 2026-10-13 04:36 to 05:21 UTC, after the account's data retention setting was changed.
Every number was generated from the run records by script. Each value is labelled by its basis: [fact] (run or queried directly), [calculated] (a fixed rule such as tokens × price), [estimate] (involves an assumption) or [source] (the supporting material). Values that could not be confirmed are marked "not verified".
:::

<RalphKpiStrip />

## Overview

This report measures, on Amazon Bedrock, how many tokens, how much money and how many LLM requests each model needs for an AI coding agent to finish the same backend implementation task. A **Ralph loop** gives the same prompt to a fresh agent session over and over; only the repository (files and git history) carries over between iterations. Every model ran with the same harness (pi coding agent) and the same API (Bedrock Converse), so the differences shown here are differences between models under the same conditions.

## Summary

- **Completion** [fact]: 69 of 70 runs completed; the one that did not is GLM 5.3 run 4. Every model's median Ralph iteration count is 1.
- **Cost depends heavily on the model** [calculated]: median cost per run ranges from $0.027 (GPT-6 Luna) to $3.495 (GPT-6 Astra), about 130×.
- **Models differ more than groups** [calculated]: the Chinese open-weight group value ($1.621) was about 2.0× the frontier value ($0.831), while costs inside the frontier group differ by about 130×.
- **Cache reads are a large share of cost** [calculated]: 94% of the tokens in completed runs were cache reads. They are cheap per token but so numerous that they made up a large part of the run cost for many models.
- **Spend** [calculated]: $106.02 in total, the $88.42 of runs used in the results plus $17.60 for the discarded first attempt. These are not billed amounts.

## How It Was Measured

<RalphMethodFlow />

- **One fix in the pi bundle**: pi 0.87.1 sends a thinking format that Bedrock rejects for Claude Haiku 5.5, so `haiku-5` was added to two model-name lists in the pi bundle. Requests to the other models are unaffected.
- **Thinking setting**: medium. Claude models receive it as adaptive thinking with effort=medium; for the other models pi sends no reasoning field, so the model default applies.

<details>
<summary>Metric definitions</summary>

- **Completed**: a run that passed the official grader. Medians and minimum–maximum ranges use completed runs only.
- **Tokens** [fact]: the usage Bedrock reported in each response, summed over all builder and verifier requests. Input means uncached input tokens; output includes reasoning tokens. Cache reads and cache writes are counted separately.
- **Cost** [calculated]: token counts times the prices under "Prices applied". Cache writes use the 5-minute cache price, the Bedrock default when, as with pi, no cache lifetime is specified.
- **Ralph iterations**: the number of iterations in which the builder ran.
- **LLM requests**: the number of responses the model returned (model-level "turns"), builder and verifier combined.
- **Run time**: from the start to the end of a run, including the builder and verifier sessions and grading.

</details>

## Models Compared

<RalphLineupMap />

- **Open-weight status** [source]: the Bedrock model cards describe Kimi K3 as an "open-weight model" and GLM 5.3 as an "open weight text generation model".
- **Claude Fable 5.1** [fact]: it can be called only when the account's us-east-1 data retention mode is `aws_review` or stronger. It ran after the account owner changed the mode from `inherit` to `aws_review` (2026-10-13 04:25:43 UTC).

- **Scope** [source]: 14 of the text-generation models callable on Amazon Bedrock in us-east-1 were measured. Bedrock also offers other text-generation models, e.g. Claude Fable 5, Claude Opus 4.7, GPT-5.6 Terra, gpt-oss-120b, Grok 4.7, DeepSeek V3.2, Qwen3 Coder Next, MiniMax M2.5, Kimi K2.5, GLM 5, which were not included ([Bedrock documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/models-region-compatibility.html), checked 2026-10-14).

<details>
<summary>What the data retention setting changes</summary>

Based on the [Bedrock User Guide: Data retention](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html) (checked 2026-10-13) [source].

- It is set through the API, not the console. Example: `aws bedrock put-account-data-retention --region us-east-1 --mode aws_review`. To revert, set `--mode inherit` again.
- It applies to every bedrock-runtime request the account sends in that Region.
- Prompts and outputs of Fable 5 and 5.1 requests are retained inside the AWS boundary for up to 30 days and may be reviewed by AWS staff. They are not shared with the model provider.
- Other models follow the modes they allow; requests to a model that allows no retention (`none`) are still not retained.
- With cross-Region inference, retained data is stored in the Region that actually processed the request.

</details>

## Results

### Model comparison

Each panel ranks the models on one metric, best first, using the median over completed runs; for all three metrics, lower is better.

<RalphModelComparison />

### Cost and time

Each point is one model: median cost per completed run on a log scale (horizontal) against median run time (vertical). Lower left is cheaper and faster.

<RalphCostTimeScatter />

### Results by model

Switch metrics to compare the range of the five runs (bar) and the median (tick); expand a row for per-run values. The table below gives the same values as numbers: medians over completed runs, with the minimum–maximum in parentheses. Cost is [calculated]; the rest are [fact].

<RalphMetricMatrix />

**Table 1. Completion, cost, tokens, requests, and time by model (medians over completed runs)**

<DataTableFrame minWidth="60rem">

| Group | Model | Completed | Cost per run (USD) | Output tokens | Total tokens | LLM requests | Ralph iterations | Run time (min) |
|---|---|---|---|---|---|---|---|---|
| Frontier | Claude Opus 5.5 | 5/5 | $0.907 ($0.861–$1.054) | 20,667 (20,402–23,773) | 796,558 (631,889–1,088,484) | 35 (30–45) | 1 | 6.1 (5.7–8.0) |
| Frontier | Claude Sonnet 5.5 | 5/5 | $0.306 ($0.257–$0.328) | 14,161 (12,677–14,407) | 445,388 (226,794–603,161) | 25 (23–27) | 1–2 | 3.8 (3.4–4.1) |
| Frontier | Claude Haiku 5.5 | 5/5 | $0.065 ($0.046–$0.084) | 52,713 (42,838–67,557) | 2,156,808 (1,155,347–2,727,358) | 50 (39–77) | 1–2 | 7.4 (6.2–9.9) |
| Frontier | Claude Fable 5.1 | 5/5 | $2.566 ($2.118–$2.837) | 26,693 (22,047–29,187) | 1,183,739 (787,229–1,564,029) | 44 (36–58) | 1 | 8.9 (6.9–10.9) |
| Frontier | Claude Opus 5 | 5/5 | $1.999 ($1.635–$3.726) | 28,503 (24,165–40,478) | 1,555,721 (1,138,625–3,851,983) | 57 (50–91) | 1 | 8.4 (6.8–14.0) |
| Frontier | Claude Sonnet 5 | 5/5 | $1.179 ($1.128–$1.455) | 32,142 (31,074–36,492) | 3,059,198 (2,787,977–4,019,069) | 85 (77–102) | 1 | 9.7 (8.1–11.4) |
| Frontier | Claude Opus 4.8 | 5/5 | $2.018 ($1.859–$2.678) | 23,804 (22,316–29,333) | 1,873,275 (1,675,909–2,735,633) | 60 (56–75) | 1 | 7.2 (6.6–9.6) |
| Frontier | GPT-6.1 Sol | 5/5 | $0.527 ($0.457–$0.559) | 20,621 (18,490–22,847) | 1,164,468 (1,096,209–1,385,667) | 46 (44–53) | 1 | 8.1 (6.5–8.8) |
| Frontier | GPT-6 Astra | 5/5 | $3.495 ($3.102–$3.562) | 22,221 (21,151–23,685) | 1,325,517 (1,139,606–1,479,623) | 48 (46–55) | 1 | 7.9 (7.3–8.8) |
| Frontier | GPT-6 Sol | 5/5 | $0.291 ($0.258–$0.358) | 8,544 (7,967–9,605) | 564,091 (432,181–818,653) | 36 (32–51) | 1 | 3.1 (2.5–3.3) |
| Frontier | GPT-6 Luna | 5/5 | $0.027 ($0.024–$0.066) | 14,272 (13,818–45,643) | 1,057,982 (848,865–1,979,669) | 50 (43–113) | 1–3 | 4.2 (4.0–15.7) |
| Frontier | GPT-5.6 Sol | 5/5 | $0.755 ($0.667–$0.908) | 12,032 (10,223–12,787) | 584,537 (505,256–775,728) | 31 (27–34) | 1 | 4.1 (3.4–5.8) |
| Chinese open-weight | Kimi K3 | 5/5 | $1.422 ($1.154–$1.640) | 39,505 (32,640–47,056) | 1,658,186 (1,276,997–1,856,453) | 61 (57–65) | 1 | 10.5 (8.2–12.0) |
| Chinese open-weight | GLM 5.3 | 4/5 | $1.821 ($1.402–$2.062) | 59,582 (48,793–77,914) | 3,766,802 (2,876,201–4,364,926) | 80 (73–89) | 1 | 10.1 (8.2–15.0) |

</DataTableFrame>

### Token mix and cost mix

<RalphTokenMix />

- Output tokens were at most 3% of all tokens for every model, but they have the highest price, so they were the largest cost component for several models. Cache reads are cheap per token but numerous; for GLM 5.3 about 68% of the run cost came from cache reads [calculated].

### Builder and verifier split

<RalphRoleSplit />

- The verifier accounted for about 4% (GLM 5.3) to 25% (GPT-6 Luna) of the run cost [calculated]. Because most runs finished in one Ralph iteration, the builder actually read the verifier's REVIEW.md in only the 4 runs with two or more iterations [fact].

### Group comparison

<RalphGroupCompare />

### Model overview

<RalphModelCards />

### Interpretation

- **Price comes first.** GPT-6 Luna and Claude Haiku 5.5 cost $0.11/$0.55 for input/output. They used 1,057,982 and 2,156,808 total tokens, yet cost only $0.027 and $0.065 per run.
- **Within one price tier, usage decides.** Claude Sonnet 5 and Sonnet 5.5 share input/output prices ($2.2/$11), but Sonnet 5 sent 85 LLM requests against 25 and cost about 3.9× as much.
- **Price and usage compound.** Claude Opus 4.8 has higher prices than Opus 5.5 (input/output $5.5/$27.5 vs $4.4/$22) and sent more requests (60 vs 35), so it cost about 2.2× as much.
- **Run-to-run spread was mostly small.** For 12 models the most expensive of the five runs stayed within 1.35× the median. The exceptions are Claude Opus 5 run 3 (about 1.9×) and GPT-6 Luna run 3 (about 2.5×).
- **The comparison uses Bedrock prices.** The cost of self-hosting the open-weight models is not covered.
- **Anomalies**: 1 incomplete run, 1 run completed after a stall, 3 self-terminated sessions and 2 transient Bedrock stream errors. Details are folded below.

<details>
<summary>Anomaly details</summary>

- **Incomplete, GLM 5.3 run 4**: In iteration 1 the builder started a node test server in the foreground and hung; the 300-second stall watchdog ended the session. Iteration 2 hit the 20-minute run cap before the builder created `.ralph-done`. Grading right after the cap passed all 13 files, but under the completion rule (`.ralph-done` plus 13 passing files) the run counts as incomplete.
- **Stall, GPT-6 Luna run 3**: In iteration 1 the builder ran `npm run dev` in the foreground and the session hung until the 300-second stall watchdog ended it. After iteration 2 the grader passed 5 of 13 files; the run completed in iteration 3.
- **Self-terminated sessions (Claude Sonnet 5.5 builder, Claude Opus 4.8 verifier and GLM 5.3 verifier)**: the agent killed its own process and the session ended with exit 143. Only Claude Sonnet 5.5 run 5 needed one more iteration because of it.
- **Bedrock stream errors (Kimi K3 run 3, 2×)**: "Bedrock stream ended without a stop reason"; pi retried automatically and completion was not affected.

</details>

## Prices Applied [source]

<RalphPriceLadder />

- **Anthropic**: the "Geo and In-region Cross-region Inference" table on the [Amazon Bedrock pricing page](https://aws.amazon.com/bedrock/pricing/), read for US East (N. Virginia) from the price data that page uses (published 2026-10-12T08:40:08Z).
- **OpenAI**: the US cross-Region inference row of the standard price table (input up to 272K tokens) in the Bedrock model cards. The largest context of a single request was 94,172 tokens, so the long-context price does not apply [fact].
- **Kimi K3, GLM 5.3**: the Bedrock model card and the pricing page respectively. Kimi K3's cache writes use the 30-minute cache price, the only one published.
- For Anthropic and OpenAI models the US cross-Region price is 10% above the global cross-Region price. The public Price List API's us-east-1 data (published 2026-10-10) had no entries for these models.

## Spend [calculated]

**Table 2. Cost of counted and discarded runs (reported tokens × price)**

| Item | Cost (reported tokens × price) | Notes |
|---|---|---|
| Runs used in the results | $88.42 | All 70 runs in isolated containers, complete or not; includes $12.87 for the five Claude Fable 5.1 runs |
| Discarded first attempt | $17.60 | Agents ran directly on the host and could interfere with each other, so the results were dropped |
| Total | $106.02 | Excludes the small pre-flight probe calls (one or two per model) |

These amounts are reported token counts multiplied by prices. The actual bill must be checked in AWS Cost Explorer; models billed through AWS Marketplace appear under each provider on the invoice.

## Limitations

1. **One task, five runs per model.** Rankings are observations for this task and setup. Even within one model the most expensive run cost up to about 2.7× the cheapest (GPT-6 Luna).
2. **The setup is a two-agent builder/verifier run.** Every model ran as builder plus verifier on pi and Bedrock Converse, so tokens and cost include the verifier's share.
3. **The first attempt was discarded.** Running without containers on one host, agents issued host-wide commands such as `pkill -f` and `fuser -k` that could stop other runs' servers, so everything was rerun in isolated containers.
4. **The verifier checked the server port more strictly than the completion rule.** Its prompt requires the `PORT` environment variable, which the completion rule does not; completion is unaffected.
5. **Some sessions self-terminated (exit 143).** pi receives the prompt as a command-line argument, so an agent that runs `pkill -f` with words from its prompt also kills itself. The prompts were not changed mid-experiment to keep runs comparable.
6. **The verifier's effect cannot be determined (not verified).** There is no control group without a verifier.
7. **Group 2 has 2 models.** Its group value is weak evidence.
8. **Kimi K3's caching differed from its model card.** Bedrock reported cache tokens for Converse calls; they were priced as reported, and the mechanism was not verified (not verified).
9. **Run timing differs.** Claude Fable 5.1 ran alone about 4 h 18 min after the other models; the effect on run time was not measured [estimate].
10. **Costs are calculated at 2026-10-12 prices.** Different prices give different results.

## Reproduction

- **Tool versions**: pi coding agent 0.87.1 (one fix for Haiku 5.5), hurl 8.0.1, Node 22.23.3, Docker images based on Amazon Linux 2023
- **Settings**: thinking medium, English prompts, up to 30 iterations, 1,200-second run cap, 300-second stall watchdog, 5 runs per model
- **Prompts**: the builder used `PROMPT-en.md` unchanged; the verifier prompt was written for this report.
- **Per-run values**: expand a model row in the "Results by model" chart to see each of the five runs. The same values are in `src/data/ralph-loop-bedrock.json` (`runs`) in this repository.
- **Harness scripts and raw data** (session records, per-run metrics, aggregate files) are not included in this repository. The task, the builder prompt and the grading Hurl tests are in the [public repository](https://github.com/roboco-io/coding-agent-benchmark).

## References

- Jung Do Hyun (정도현, Roboco), [Ralph loop completion by model](https://roboco.io/coding-agent-benchmark/) (reference, checked 2026-10-14 05:27 UTC)
- [roboco-io/coding-agent-benchmark](https://github.com/roboco-io/coding-agent-benchmark) (the task, the builder prompt and the grading Hurl tests)
- [Amazon Bedrock pricing](https://aws.amazon.com/bedrock/pricing/)
- [Amazon Bedrock User Guide: Data retention](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
- [RealWorld backend API specification](https://realworld-docs.netlify.app/specifications/backend/endpoints/)
- [pi coding agent](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
