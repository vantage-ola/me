---
title: igoPay
role: Founder & Engineer
period: 2026 – present
status: active
highlight: true
tags: [rust, kotlin, android, uniffi, cryptography, qr, offline payments]
description: Offline payment acceptance through signed obligations that a merchant can verify by QR without a network.
links:
  - label: Website
    url: https://igopay.site
  - label: Public verifier
    url: https://github.com/vantage-ola/igopay-verify
---

igoPay lets a merchant verify a customer's signed promise to pay while both phones are offline. The promise is a pending obligation, not a transfer. Money settles later through a licensed payment rail.

## The problem

When a network goes down, a trader has no reliable way to check a customer's claim that they've paid. A screenshot or transfer alert can be faked. igoPay gives the trader something they can verify on their own phone before deciding whether to release goods.

## What I built

The protocol lives in a `no_std` Rust core. It encodes and verifies signed promises, links each payer's promises in a hash chain, and produces a verifiable fork proof if the same payer tries to spend twice. UniFFI exposes the same core to Kotlin and Swift, so the phone clients don't need separate protocol implementations.

I built an Android prototype for the QR request, sign, and verify flow. Its payment path has been tested on two phones in airplane mode. The issuer side handles device registration, detects forks reported by different payees, and publishes signed block lists. Public verifier and witness tools let others audit the publication history.

## Where it stands

The protocol and Android prototype are built and tested. igoPay does not hold customer funds or settle payments itself. A field deployment still needs a licensed partner and a settlement integration.
