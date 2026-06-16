---
title: verity
role: Author
period: 2026
status: active
highlight: true
tags: [python, walrus, sui, memwal, pydantic, typer, ai-agents, hackathon]
links:
  - label: GitHub
    url: https://github.com/vantage-ola/verity
  - label: PyPI
    url: https://pypi.org/project/walrus-verity/
---

A proof-chain registry for AI agents, backed by Walrus for persistent, portable, verifiable memory. Built for the Sui Overflow hackathon, Walrus track.

## The Problem

AI agents do work — research, verification, evaluation — but have no persistent record of what they claimed, what they tested, and what they proved. Session ends, context is gone, and there's no way for another agent (or a future session) to verify what actually happened.

## What I Built

verity gives agents a structured 5-layer proof chain:

```
feature → claim → test → evidence → release
```

You build up the chain as your agent works, then push it to Walrus and get back a `blob_id`. That blob_id is the proof — immutable, content-addressed, permanently retrievable by any agent on any machine.

```bash
verity push   # → blob: AbCdEfGh…
verity pull AbCdEfGh…   # restore anywhere, any agent
```

Two storage backends: **WalrusBackend** stores blobs directly via the Walrus REST API. **MemWalBackend** adds a semantic discovery layer — agents can `recall("verity registry for repo:X")` without knowing the blob_id in advance.

The `verity site` command generates a human-readable HTML proof page and pushes it to Walrus — public, browseable, no hosting required.

Releases are fail-closed: every verified claim must have a passing test with passed evidence, or the release is rejected. No partial proofs.

## Result

Published as `walrus-verity` on PyPI. 105 tests, 96% coverage. The project dogfoods itself — verity's own proof chain lives in `verity.json` in the repo, pushed to Walrus mainnet.
