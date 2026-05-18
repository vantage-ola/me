---
title: On simplicity in software
date: 2025-04-12
tags: [design, software, opinion]
excerpt: Simplicity isn't about having fewer features. It's about having fewer concepts.
---

Simplicity isn't about having fewer features. It's about having fewer concepts.

A tool can have twenty features and still be simple if those features all follow from one clear idea. A tool can have three features and be incomprehensible if those three features don't relate to each other in any obvious way.

## The difference

The thing people usually call "simplicity" in software is really *familiarity*. Git feels simple to experienced developers not because it's simple. it's famously not — but because they've internalized its model. To someone new, it's terrifying.

Real simplicity is when the model is small enough that you can hold it in your head and derive the behavior from first principles. You don't need to memorize edge cases because the edge cases follow logically from the core rules.

UNIX pipes are like this. The idea is tiny: programs read from stdin, write to stdout, chain them together. Everything else falls out of that. It took one good idea and fifty years.

## Why it's hard

Simplicity is hard because complexity accumulates in small increments. Each individual decision seems reasonable. The feature request is valid. The special case is real. The configuration option is genuinely needed by someone.

But each one adds a concept. And concepts compound. After enough additions you have a system that's explainable only by its history, not by any underlying idea.

The only defense I know is to keep asking: what is this actually for? What's the smallest model that covers the real use cases? What would I remove if I had to?

## What I try to do

I try to design around a core idea small enough to fit in a sentence. Not because that's always achievable, but because the exercise of trying forces you to understand what you're actually building.

If I can't explain the mental model in a sentence, I probably don't understand it well enough yet. The code can wait.
