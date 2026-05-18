---
title: Why I build my own tools
date: 2025-05-01
tags: [building, tools, opinion]
excerpt: Most tools solve the general case. I'm usually interested in my specific case.
---

Most tools solve the general case. I'm usually interested in my specific case.

This isn't about NIH syndrome or distrust of open source — most of the code I ship depends on packages written by other people and I'm grateful for every one of them. It's about something different: when you build a tool yourself, you understand it completely. There's no magic. No "it just works, don't touch it."

When something breaks at 2am, that matters.

## The real reason

The deeper reason is that building tools teaches you things that using tools doesn't. When you write a markdown renderer, you learn how parsers work, how AST transformations compose, what "trust boundary" actually means when you're accepting user HTML. You can't get that from a README.

The same goes for editors, build systems, deployment pipelines. The people who understand these things best built their own version at some point — not to ship, but to learn.

## When it makes sense

I'm not arguing everyone should build their own everything. That way lies madness and unmaintained GitHub repos with one star (your own).

It makes sense when the existing tools don't fit your use case and there's no real escape hatch. Or when you need to understand a domain deeply and building through it is faster than reading about it. Or when the thing is small enough that you can actually finish it.

It doesn't make sense when the problem is already solved well and you'd just be burning time to end up in the same place.

## Where this leaves me

I build a lot of tools. Some are useful to other people, most are useful only to me, a few were useful only while I was building them. I'm fine with all three outcomes.

The point isn't to have a portfolio of impressive projects. The point is to keep getting better at understanding how things work. The projects are a byproduct.
