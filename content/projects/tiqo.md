---
title: Tiqo
role: Author
period: 2026 – present
status: active
highlight: true
tags: [python, fastapi, sqlalchemy, alembic, postgresql, react, typescript, vite, tailwind, socketio, paystack, claude-vision, pwa]
links:
  - label: GitHub
    url: https://github.com/vantage-ola/tiqo
  - label: Website
    url: https://playtiqo.xyz
  - label: App
    url: https://app.playtiqo.xyz
---

A mobile-first PWA for running eFootball competitions: leagues, knockouts, and group-plus-knockout formats. Built for the WhatsApp communities across Nigeria and the rest of Africa that already run weekend cups for cash.

## The Problem

These communities organize on WhatsApp. Every cup runs into the same two things. Results get disputed because it's one person's word against another's. And somebody has to hold everyone's entry money, which means everyone has to trust that person not to disappear with it.

Manual standings, screenshots scattered across a chat, and a pot of cash in one guy's account. It works until it doesn't.

## What I Built

Tiqo turns the whole thing into an app without asking anyone to leave the group.

Results are submitted by uploading a post-match screenshot. Claude Vision reads the score and both gamertags off the image, a fuzzy match links those gamertags to the two participants, and the opponent confirms. The screenshot is kept as a permanent record, so a disputed result has proof attached instead of an argument.

Entry fees go into an escrowed pool. The organizer never holds the money. When the competition ends, prizes pay out to the winners' bank accounts through Paystack, and a cancelled competition refunds automatically.

Standings update live. The moment a result is confirmed, the league table recomputes and pushes to every viewer over Socket.io. The bracket and table are shareable by link, no account needed to look.

## Architecture

The backend is FastAPI with async SQLAlchemy, composed as a Socket.io ASGI app so realtime and HTTP share one process. Every external service (vision, blob storage, payments, notifier) sits behind a `Protocol` and resolves through a registry gated by a `USE_FAKES` flag. Local dev runs the entire app, payments and vision included, with zero credentials against in-memory fakes.

The result lifecycle is a real state machine: `PENDING_CONFIRMATION → CONFIRMED | DISPUTED`, `DISPUTED → CONFIRMED | REJECTED`, with an admin override from any state. Domain logic lives in a services layer (bracket generation, fixtures, results, standings, validation) that's unit-tested directly.

Money is stored as integer kobo everywhere, never floats. All primary keys are UUIDs.

The frontend is React 19 with Vite and Tailwind v4, installable as a PWA with web push through a custom service worker. TanStack Query for server state, Zustand for auth, a single typed fetch client that logs you out on a 401.

## Status

Active development. The domain core, payment escrow, vision pipeline, and live standings are built and the test suite is substantial. The next milestone is a real-money pilot with one existing community to exercise the Paystack payout path end to end and validate screenshot parsing against real eFootball captures before opening it up.
