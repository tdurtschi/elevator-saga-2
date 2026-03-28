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

## AI removes the friction argument against TDD

Most objections to TDD are about human time and cognitive overhead: switching context, maintaining discipline, the upfront cost before you have a clear picture. An AI agent removes most of that friction. The cost of writing the test first is essentially the same as writing it after. The discipline argument becomes moot.

TDD + AI may be the natural way to work with these tools, more than it ever was with purely human developers.

## The symmetry

There are two legs to the loop:

1. **Natural language → test**: You describe a behavior, the AI translates it into a precise, falsifiable test. Ambiguity in your description gets surfaced by the translation step.

2. **Test → natural language**: The AI reads the test suite and narrates the specified behavior back in plain English. The tests are ground truth; the AI is the translator.

The second leg is underused. Most people treat the test suite as a thing you run, not a thing you read. But as a design document it has a lot of signal.

## Session start habit

Before writing anything new, ask the AI to narrate the current test suite: what's covered, what's implicit, any gaps or inconsistencies. A standup grounded in verifiable behavior rather than memory.

## Component tests vs. system narrative

Component-scoped tests specify what each piece does in isolation. But the end-to-end story — how a simulation actually runs from start to finish — is not captured unless you write integration tests that span the whole flow.

A test suite can describe the vocabulary of a system without capturing the grammar. That gap is easy to miss when reading tests individually, but surfaces immediately when you ask for a behavioral narration of the whole suite.

## Missing: the dynamics

This codebase has a specific version of this flaw. The component tests specify *state* well — what a queue looks like after certain calls, what a button state is after an event. But the simulation is fundamentally about *time and flow*: things happening in sequence, triggering other things, converging toward a challenge outcome.

That dynamic is load-bearing. It's what the player's algorithm actually has to work with. But it's not pinned down anywhere as a spec.

The consequence: you can have all component tests green and still have a broken simulation, because the integration of components *in time* was never specified. This is the same failure mode the red step guards against at the unit level — showing up at the system level instead.

The fix is integration tests that describe the simulation as a sequence of events: a user spawns, presses a button, the elevator responds, moves, the user boards, the challenge evaluates. Until those exist, the most important behavior of the system is unspecified.
