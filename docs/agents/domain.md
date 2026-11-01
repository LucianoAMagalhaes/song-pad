# Domain Docs

This repo uses a single-context layout: `GLOSSARY.md` at the repo root and architecture decision records in `docs/adr/`.

## Before exploring the codebase

- Read the root `GLOSSARY.md` for domain terminology.
- Read ADRs in `docs/adr/` that touch the area you are about to work in.

If these files do not exist, proceed silently. The `domain-modeling` skill creates them lazily when terms or decisions actually get resolved.

## File structure

- `GLOSSARY.md`: shared domain vocabulary.
- `docs/adr/NNNN-<decision>.md`: numbered architecture decision records.

## Use the glossary's vocabulary

When naming a domain concept in an issue, proposal, hypothesis, or test, use the term defined in `GLOSSARY.md` and respect any synonyms it explicitly avoids.

If a concept is missing, reconsider whether the project uses that concept. Record real terminology gaps for `domain-modeling`.

## Flag ADR conflicts

When a proposal contradicts an existing ADR, identify the ADR and explain why the decision should be reconsidered.
