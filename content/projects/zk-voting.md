---
title: ZK Voting
role: Student
period: 2025 
status: completed
highlight: true
tags: [react, typescript, node.js, express, semaphore, zkp, mysql, metamask, ethers]
links:
  - label: Github
    url: https://github.com/vantage-ola/zkdemocracy
  - label: Paper
    url: https://docs.google.com/document/d/1FNRiNzHDRlyvIaD7HrHJItTFxdsB3NOtDU9wnA1DRSg/edit?usp=sharing
---

A full-stack anonymous voting platform for student elections, built on the Semaphore ZKP protocol — voters prove eligibility without revealing identity.

## The Problem

Student union government elections at OOU ran on Google Forms — matriculation number + candidate selection. No anonymity, no tamper resistance, trivially fraudable.

## What I Built

I started from Fazekas' zkDemocracy and extended it significantly. Voters authenticate anonymously through MetaMask using ZK identity commitments, and Merkle trees handle group membership so eligibility is tied to your department or class without exposing who you are.

A nullifier system stops double-voting while keeping anonymity intact. On top of that I built a React/TypeScript frontend, an Express.js backend backed by MySQL storing commitments, proofs and nullifiers, and checkpoint hashing across the stored proof chain so any tampering is detectable.

## Result

A student voter can cast a ballot, and even if the entire database is leaked, their identity cannot be linked to their vote. Wrote an academic paper on it for my CS final year project at OOU.
