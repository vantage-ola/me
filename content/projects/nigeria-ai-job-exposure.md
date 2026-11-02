---
title: AI and Nigerian Remote Work
role: Researcher
period: 2026 – present
status: active
highlight: true
tags: [research, ai evaluation, rubric design, data analysis, python, o*net, ilo]
description: A task-by-task test of which Nigerian remote and freelance jobs AI can do, and how well the big AI-and-jobs studies fit them.
links:
  - label: Brief
    url: https://github.com/vantage-ola/research-analyst-project/blob/main/job-exposure/output/brief.md
  - label: Data and code
    url: https://github.com/vantage-ola/research-analyst-project
---

Many Nigerians earn in dollars doing remote work: customer support, writing, bookkeeping, data labelling, tutoring. Most studies on AI and jobs are built on American job lists. I wanted to see what they miss about this work as Nigerians actually do it.

## What I did

I picked 12 common remote jobs and split each into 7 tasks, 84 in all. Most come from O\*NET, the US government's job database. I changed some to fit Nigerian work and added 11 that only exist here, like WAEC and JAMB prep, Paystack integrations and PAYE payroll.

I scored every task from 0 (AI can't do much of it) to 2 (AI can do most of it) on a published rubric. An AI model scored the same tasks separately as a second opinion, so I could measure how much two raters agree.

Then I tested 22 of the tasks for real on three Claude models, in empty sessions with no extra instructions. I shuffled the 66 answers, hid the model names, and graded each from 1 (unusable) to 4 (ready for a client). Finally, I matched my tasks to three published sources: the ILO's 2025 AI exposure index, the "GPTs are GPTs" paper, and Anthropic's Economic Index.

## What I found

AI did well on text, numbers and admin. Every model reconciled a bank statement correctly, applied Nigeria's 2026 tax bands, and spotted that a meeting I asked for was impossible. It failed on Nigerian facts and languages: a Yoruba translation that said the wrong thing, a banking statistic presented the wrong way round, and sales emails with invented details.

The big studies don't fit this work well. 17 of my 84 tasks have no match in the US job database, including almost all data annotation work, one of the fastest-growing remote jobs for Nigerians. My scores, the ILO index and actual Claude use rank the 12 jobs in different orders.

## Where it stands

The data, prompts, AI answers, grades, analysis code and a full brief with limitations are public. The main gaps are a worker survey, which I didn't run this round, and testing models from other companies. Next, I'm comparing Nigeria's National AI Strategy with these results.
