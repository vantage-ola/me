---
title: "Everybody Above The Fab Is A Tenant"
date: 2026-07-10
tags: [ai, hardware, economics]
excerpt: The PS5 got more expensive with age, a first. Follow that thread down to the silicon and ask who's actually paying for the AI boom.
---

I was about to message my uncle to ask if he could help me buy a PS5. What stopped me was the price. The console is more expensive now than when I first wanted one. Not the Pro, the normal disc version: $650, up from $499 at launch, sitting there in its sixth year on the market.

Consoles get cheaper as they age. They always have. The parts get cheaper to make, the factories get better at making them, and the price drifts down until the thing is affordable enough to sit under everyone's TV. The PS5 is the first console in history to do the opposite, to get more expensive the older it gets. Sony raised it twice in eight months. Microsoft did the same to the Xbox, Nintendo to the Switch 2. Three companies, three different chip suppliers, three different strategies, all raising prices in the same year for the same stated reason.

The console got more expensive because of where the memory inside it went. And that is when this stopped being the essay I meant to write, the one about AI slop and whether any of it is worth the value it brings, and turned into a more interesting question: who is actually paying for all of this?

## The Wafer Is The Whole Story

A console is really just a processor, some fast memory, and storage, bundled together and sold at a thin margin. When the chips inside get more expensive, so does the console, because that thin margin was never big enough to hide the cost. And the chips got a lot more expensive. Microsoft said it plainly in its own price notice: memory and storage now cost more than 2.5 times what they used to, and it expects that to roughly double again by late 2027.

The memory that AI datacenters need is called HBM. It is ordinary memory chips stacked into towers and placed right next to the AI processor, so it can be fed fast. The catch is that those chips come off the same factory wafers as the memory in your phone, your laptop, or your PlayStation. There is no separate HBM factory. So every wafer that goes to a datacenter is one that did not become memory for a person.

The memory makers are not the villains here. They are just doing the math. HBM sells at a premium, so they point their factories at it, and consumer memory gets scarce and expensive as a result. A normal 16GB stick of RAM jumped from about $137 to $207 in a single quarter this year. Micron made about 17% of its memory revenue from HBM and cloud chips in 2023; by 2025 it was close to half. The amount of memory reaching ordinary buyers is actually shrinking.

This will not fix itself soon. FAB-rica-tion plants take years. The ones under construction land in 2027 or 2028. AMD says memory prices will not come back to normal before then. Lenovo has more or less told everyone to get used to it.

Notice what did not happen anywhere in that chain. Nobody bought a chatbot subscription. The price of my RAM, and the price of that PS5, is not downstream of anyone's AI usage. It is downstream of a capacity decision made in a boardroom. The PS5 is the console market being asked to outbid the AI industry for the same silicon, and losing.

## Follow The Money Out Of The Stack

Now hold that next to the companies everyone thinks are winning.

OpenAI expects to spend around $50 billion on compute this year, against roughly $13 billion of revenue. It loses about $1.22 for every dollar it earns. Anthropic is the exception, close to its first profitable quarter, but it got there by running its models more cheaply, not by charging users more. Both are burning cash to rent computing power.

So the labs are renters too. They rent from the big cloud companies. The cloud companies rent from Nvidia. Nvidia leans on TSMC and the memory makers. And the memory makers depend on ASML, one company in one country that builds the one machine nobody else can.

Follow that chain down and the money keeps flowing past everyone to the bottom, to whoever owns something physical that cannot be copied or out-spent. This is an old pattern. When a thing gets cheap, the money moves to whatever is scarce right beside it. Intelligence is getting cheap. Silicon is not. So the value flows to silicon, and to the handful of firms that own the part of it no one can reproduce for years.

Which is why the slop argument was the wrong one to write. The problem is not that AI makes bad images. The problem is that a bet on some huge future payoff is being funded, right now, by a hidden tax on the price of every phone, laptop, and console on earth. Budget Android phones get hit hardest, because Apple and Samsung locked in their chip supply a year or two ahead and the smaller makers could not. The people paying the tax are not the people holding the winning ticket.

## What A Senior Actually Told Me

I asked a senior engineer about this a few days ago. Not about hardware, about jobs. I am barely two years in, my last company folded, and I wanted to know, honestly, with agents doing so much of the implementation now, what makes someone early-career worth hiring. What do you look for now that you didn't before.

His answer was one of the most useful things anyone has said to me this year.

If you just want a job, he said, don't chase the big tech names or even a pure tech company. Go find an ordinary business that needs someone technical in-house. A real estate firm that needs somebody to build and run their systems. It looks like an IT role, and it gets you in a door, learning how organisations actually work, getting paid while you do it.

But if you want to be an engineer, if you want to build, then he was blunt about the moat. Picture four or five seniors getting together to architect a solution. Why would they hand that to you to implement instead of to a coding agent? The agent is faster and it doesn't need the design explained twice. That is the actual competition now, and it is not another junior. It is the tooling.

So the way in, he said, is to become the person who does the work the agent cannot own. When high-quality code can be generated in parallel at that speed, the scarce skill is coordination. Fanning work out and pulling it back in. Deduping it. Tracing a feature across a big polyglot codebase. Thinking about whether a release will still be maintainable in two years, whether a feature will still scale. Applying real structural discipline to how a whole system fits together, not just whether one function compiles.

That reframed the thing I had been angry about. I kept wanting to say AI took the junior jobs. And there is evidence that looks like it: Stanford found employment for developers aged 22 to 25 fell about 20% since 2024, while developers over 30 at the same companies grew between 6% and 12%. But then SignalFire looked at the twelve biggest tech firms and found engineers were 55% of new hires in 2025, up from 46% in 2019, and argued that if AI were really replacing engineering labour, engineering would be the first thing to fall, and it isn't. Both can be true. Fewer juniors, more engineers, because the bar to get in moved up. And AI is not the only thing going on. Interest rates jumped, and companies were also cutting back after hiring too many people in 2021. Nobody has cleanly separated how much of the damage is AI and how much is the rates and the layoffs.

So I won't say AI took the jobs. What the senior engineer described is a bit worse. If a senior with an agent covers the work a junior used to do, no single firm has a reason to train juniors anymore. The firm gets none of the benefit. The industry, ten years out, eats the whole cost, because seniors are only juniors who survived. Every company is behaving rationally and the result is still bad. Nobody has to be conspiring for that to happen, which is also why pointing it out won't fix it.

So the only real move I have is the one he gave me: get out of pure implementation and into the work that holds a whole system together, because that is the part that still pays.

## What I Actually Think

I use these tools. I have shipped more in the last year with an agent than in the two, three years without one. Sitting in Lagos at 2am with a collaborator that never sleeps is not the same good it is in San Francisco, and I won't pretend otherwise.

Leverage for me is not value for us. Those don't mean the same thing. The first shows up in my commit history. The second is supposed to land across the whole economy, and so far it has mostly landed in one place: Samsung's income statement.

That could change. Factories electrified around 1890 and productivity barely moved for thirty years, until someone stopped bolting motors where the old steam shafts used to be and redesigned the building around the motor. Solow said in 1987 that you could see the computer age everywhere except in the productivity statistics, and then eventually you could. Maybe this is the same, and I am the man in 1895 complaining about the electricity bill.

Maybe. But "just wait" is a posture, not an argument, and it costs the person saying it nothing. What I can see today is a six-year-old console that costs more than it did at launch, memory I can't afford at Nigerian import prices, and the profits from both already sitting on someone else's balance sheet.

The boom is real. It just isn't, so far, a boom for the people paying for it. I can't change who owns the silicon. All I can do is try to stay on the side of the work that still needs a person, and I am not sure that will be enough.
