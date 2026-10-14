---
title: LEVELS
role: Creator & Engineer
period: 2026 – present
status: active
highlight: true
tags: [typescript, next.js, react, postgresql, sqlite, scoring, product design]
description: Achievement profiles for the different ways people build a life in Nigeria.
links:
  - label: Website
    url: https://levels.tmpr.space
---

LEVELS turns completed achievements into profiles and level cards. It counts work, learning, building, care and independence, with rules for what qualifies and how much each achievement contributes.

## What I built

The live directory has 150 Nigerian public figures. Visitors can read their profiles, check the sources behind scored achievements, rate people across six dimensions and compare any two in Face Off. Search and field filters make the directory easier to browse. A profile that has not been assessed says “Not scored yet” instead of showing a made-up score.

I built the scoring engine around a versioned rubric and exact arithmetic. Claimed achievements start with partial XP; reviewed receipts can support more. The app keeps assessment history and public snapshots separate, so a score change does not silently rewrite a published profile. The site runs on Next.js and React, with PostgreSQL in production and SQLite for local development.

Visitors can also answer guided questions about their own completed milestones and get a private, provisional level card. The preview explains what counted and what still needs more information.

## Where it stands

The public directory, ratings, comparisons and private preview are live. Research and scoring are still in progress, so public levels reflect the achievements counted so far rather than a complete account of anyone's life.
