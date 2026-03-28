# AI Pairing: Lessons on TDD and Specs

Notes from working through how to collaborate effectively with an AI agent on this codebase.

## Tests are executable specs

Writing a test first is approximately writing a technical spec in very discrete terms. The conversation about design becomes about translating intent into falsifiable, machine-verifiable claims. When the tests are written and red, the design phase is done. Implementation is just making them green.

This means:
- The chat with the AI is the design phase
- The test is the artifact that captures the decisions made in it
- The test suite is a more trustworthy record of intent than notes or docs, because it's executable

## The red step is the most important

A test that has only ever succeeded has never been tested. The red step is the only moment you verify the test is actually capable of catching the failure it's meant to catch. Skip it and you might have a test that always passes regardless — false confidence that is arguably worse than no test at all.

## The symmetry

There are two legs to the loop:

1. **Natural language → test**: You describe a behavior, the AI translates it into a precise, falsifiable test. Ambiguity in your description gets surfaced by the translation step.

2. **Test → natural language**: The AI reads the test suite and narrates the specified behavior back in plain English. The tests are ground truth; the AI is the translator.

## Session start habit

Before writing anything new, ask the AI to narrate the current test suite: what's covered, what's implicit, any gaps or inconsistencies. A standup grounded in verifiable behavior rather than memory.

## What is spec debt?

A test suite can cover all the vocabulary of a system — what each component does in isolation — without capturing the grammar: how components interact in sequence over time.

Spec debt is the gap between what the tests specify and what the system actually has to do. Unlike technical debt, it's invisible — everything is green, but the most important behaviors are unverified.

This codebase has a concrete instance: the component tests specify state well, but the simulation is fundamentally about time and flow. A user spawns, presses a button, an elevator responds, moves, the user boards, the challenge evaluates. That sequence is load-bearing — it's what the player's algorithm actually has to work with. But it's not pinned down anywhere as a spec.

The fix is integration tests that describe the simulation as a sequence of events. Until those exist, the green suite is incomplete evidence.
