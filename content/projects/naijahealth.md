---
title: NaijaHealth
role: Author
period: 2026 – present
status: active
highlight: true
tags: [python, fastapi, playwright, postgresql, qdrant, redis, whatsapp-api, rag, embeddings, docker]
links:
  - label: GitHub
    url: https://github.com/vantage-ola/naijahealth
---

A WhatsApp/Telegram bot that makes NAFDAC data actually searchable. Drugs, food, cosmetics, vaccines. Ask in plain language, get a real answer.

## The Problem

NAFDAC (Nigeria's food and drug agency) publishes a lot of useful data. Whether a drug is approved, what's in a product, whether something is flagged. But the website is hard to navigate and impossible to query. Most Nigerians can't easily verify whether a drug they've been prescribed is legitimate, or whether a food product is safe.

## What I Built

A pipeline that scrapes the NAFDAC website daily with Playwright, validates and stores the data in PostgreSQL, then embeds it into Qdrant for semantic search. When someone messages the WhatsApp bot, the query goes through a RAG pipeline to retrieve relevant chunks, prompt an LLM, send the answer back via WhatsApp.

Redis handles caching so repeated queries don't hit the vector store every time. A scheduler keeps the data fresh without manual runs.

## Why WhatsApp

Same reason as Oda: that's where people are. No app to download, no account to create. You already have WhatsApp.
