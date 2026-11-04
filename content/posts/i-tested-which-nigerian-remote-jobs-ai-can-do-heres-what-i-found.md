---
title: "I tested which Nigerian remote jobs AI can do. Here’s what I found."
date: 2026-11-02
tags: [ai, jobs]
excerpt: "A lot of young Nigerians earn in dollars from their phones and laptops."
medium_id: "47f205efd59f"
medium_url: "https://iloveracing.medium.com/i-tested-which-nigerian-remote-jobs-ai-can-do-heres-what-i-found-47f205efd59f"
---

A lot of young Nigerians earn in dollars from their phones and laptops. They answer customer emails for fintechs abroad, write blog posts, keep books for small businesses, label data for AI companies, and tutor students in other time zones.

Every few months a new report says AI is coming for our jobs. But those reports are built on American job lists and American assumptions. I wanted to know what they miss about work as Nigerians actually do it.

So I picked 12 of these jobs, broke them into tasks, and tested AI on them.

## **How I did it**

I chose 12 common remote jobs: customer support, data annotation, content writing, virtual assistance, bookkeeping, transcription, translation, graphic design, online tutoring, entry-level web development, social media management, and remote sales.

I split each one into 7 tasks, 84 in all. Most come from [O*NET](https://www.onetonline.org/), the US government’s database of what each job involves. Some I changed to fit Nigerian work, and I added a few that only exist here: WAEC and JAMB prep, Paystack integrations, PAYE payroll, transcribing Pidgin.

Then I scored each task from 0 to 2:

- **0:** AI can’t do much of it.
- **1:** AI can do part of it, but a person still does a lot.
- **2:**AI can do most of it, and a person just checks.

I also had an AI model score the same 84 tasks separately, as a second opinion. Neither of us saw the other’s answers.

Scores are only opinions, so I tested 22 of the tasks for real. Three Claude models (Haiku 5.5, Sonnet 5.5 and Opus 5.5) each did all 22, giving 66 answers. I hid which model wrote which and graded each from 1 (unusable) to 4 (ready to send to a client).

## **What AI did well**

The jobs most exposed to AI are built on text, numbers and admin. Virtual assistance, web development, writing, bookkeeping and transcription. On most jobs I scored higher than my AI second rater did, and the chart shows the gap.

![my exposure scores next to my AI second rater’s, for each of the 12 jobs](https://cdn-images-1.medium.com/max/1024/1*Sjjv8oDSERPS4xl3XygKSw.png)

*my exposure scores next to my AI second rater’s, for each of the 12 jobs*

Some of the tests surprised me:

**Bookkeeping.** I gave the models a small bank statement and cash book with four mistakes hidden in them. Every model found all four and got the right closing balance.

**Payroll.** I asked for monthly PAYE deductions on a ₦450,000 salary. All three used the new tax bands that took effect in January 2026 and showed their working.

**A trick question.** I asked for a one-hour meeting with people in Lagos, New York and Manila, all within working hours. There’s no such slot, because Manila’s day ends before New York’s starts. All three models said so instead of making up times.

**Code.** They fixed a React bug and wrote a working Paystack integration that handled repeated payment notifications.

Before testing, my AI second rater had guessed most of these were only “partly” doable. The tests proved it too cautious.

## **Where AI fell down**

The failures had something in common. They were about Nigerian facts and Nigerian languages.

**Yoruba.** One model translated “your order has shipped” as “your permit document has been sent to you”. The same answer could also be read as telling the customer to switch off their phone. I’m Yoruba, and I checked these myself.

**Local statistics.** I asked for a paragraph on POS agents with two real statistics. One answer took the 2016 figure for how many Nigerians were *excluded* from banking and called it the number *included*. It looked confident and properly cited, and it was wrong.

**Invented details.** Two sales emails added facts about the client that I never gave them.

A client in London or New York wouldn’t catch any of these. A Nigerian freelancer would. That might be the most useful finding: in these jobs, what a person adds is local knowledge and checking the work.

## **The big studies don’t fit this work**

I compared my scores with three published sources: the International Labour Organization’s 2025 AI exposure study, the “GPTs are GPTs” paper, and Anthropic’s Economic Index, which tracks what people actually use Claude for.

Three things stood out.

![my scores, the ILO study and actual Claude use for each of the 12 jobs](https://cdn-images-1.medium.com/max/1024/1*tL7U3JSxmz2X_BjYdD3-Bg.png)

*my scores, the ILO study and actual Claude use for each of the 12 jobs*

**Data annotation is almost invisible to them.** Six of the seven annotation tasks I listed have no match in the US job database these studies rely on. Labelling data for AI companies is one of the fastest-growing remote jobs for Nigerians, and the main studies barely see it.

**They rank jobs in different orders.** My scores, the ILO study and actual Claude use don’t agree on which jobs are most exposed. Partly that’s because they ask different questions. One asks whether AI can halve the time a task takes, another scores whole occupations, and one counts actual use.

**”Can” isn’t “does”.**Transcription and content writing score high on what AI could do, but low on what people actually use Claude for. There’s a gap between possible and practical. My guess is that it’s wider in Nigeria, because of card payments, data costs, power, and work that runs on trust and referrals. I didn’t measure that this time.

## **What I got wrong**

I want to be clear about the limits.

I graded the AI answers too generously. I gave every one a 3 or a 4 and didn’t write down the fact checks I meant to do. My AI second rater caught mistakes I missed. I’ve left my grades as they were and said so, because that’s a real finding about how easy it is to trust confident AI output.

My second rater is also an AI, from the same company as the models I tested. I didn’t ask any Nigerian workers yet. And I only tested Claude models, not ChatGPT or Gemini.

Finally, this is about what AI **can** do, not a prediction of job losses. A task AI can do may still be done by people.

## **What I’d tell someone doing this work**

If your job is mostly turning a clear brief into text, code or a spreadsheet, AI can already do a lot of it. The value you can add is the part it gets wrong: Nigerian context, local languages, and checking facts before they reach the client.

All my data, prompts, AI answers, grades and code are public on [GitHub](https://github.com/vantage-ola/research-analyst-project), along with a longer brief with full methods and limitations. If you do one of these jobs and think I’ve got something wrong, I’d like to hear it.

*Next, I’m looking at what*[*Nigeria’s National AI Strategy promises*](https://medium.com/@iloveracing/i-read-five-african-ai-strategies-heres-what-they-actually-promise-3335e5b8c857?sharedUserId=iloveracing)*on jobs and skills, and how that compares with what I found here.*
