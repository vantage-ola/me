---
title: verity
role: Author
period: 2026
status: active
highlight: true
tags: [python, walrus, sui, memwal, pydantic, typer, ai-agents, hackathon, mcp, ed25519]
links:
  - label: GitHub
    url: https://github.com/vantage-ola/verity
  - label: PyPI
    url: https://pypi.org/project/walrus-verity/
---

A proof-chain registry for AI agents, backed by Walrus. Built for the Sui Overflow 2026 hackathon, Walrus track.

## The Problem

AI agents write code and say "tests pass", but there's no way to verify that claim independently. Multi-agent pipelines hand off work between models with no receipt, no audit trail. Open source packages are increasingly AI-generated with no proof of what was actually tested.

The trust problem is real and nobody is building infrastructure for it.

## What I Built

verity gives agents a structured 5-layer proof chain:

```
feature → claim → test → evidence → release
```

You build up the chain as your agent works, then push it to Walrus and get back a `blob_id`. That blob_id is the proof: immutable, content-addressed, permanently retrievable by any agent on any machine.

```bash
verity push   # → blob: AbCdEfGh…
verity pull AbCdEfGh…   # restore anywhere, any agent
```

Two storage backends: **WalrusBackend** stores blobs directly via the Walrus REST API. **MemWalBackend** adds semantic discovery so agents can `recall("what features have we verified?")` in natural language without knowing the blob_id in advance.

Releases are fail-closed: every verified claim must have a passing test with passed evidence, or the release is rejected. No partial proofs.

## Multi-Agent Trust

The core use case is agent-to-agent handoffs. Agent A builds a feature, signs the blob with an Ed25519 key, and pushes to Walrus. Agent B receives the blob_id, calls `verity verify` to check the signature and chain integrity, then extends the chain and pushes a new blob. Trust between agents is grounded in Walrus immutability, not in trusting the sender.

`verity push --upload-artifacts` goes further: individual test report files (JUnit XML, SARIF, logs) are uploaded as separate Walrus blobs with `artifact_path` rewritten to `walrus://<blob_id>`. The entire proof chain, registry and raw artifacts, lives on Walrus.

## Feature Set

- `verity track` — one command builds the full chain from a test file
- `verity recall` — natural language query against MemWal semantic memory
- `verity sign` + `verity verify` — Ed25519 agent-to-agent signing
- `verity diff` — diff two Walrus blob snapshots
- `verity export` — SARIF 2.1.0, JUnit XML, SPDX-2.3 export
- `verity watch` — daemon mode, auto-push on valid change
- MCP server — Claude Code, Cursor, and Windsurf get native proof-chain tools

## Result

Published as `walrus-verity` on PyPI at v0.3.14. 306 tests, 96% coverage. The project dogfoods itself: verity's own proof chain lives in `.verity/registry.json` in the repo, pushed to Walrus.
