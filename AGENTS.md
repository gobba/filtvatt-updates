# Filtvatt definition repository instructions

This is the separate definitions repository. Its canonical remote is
`https://github.com/gobba/filtvatt-updates.git`, branch `main`. It publishes
signed scanner data; it does not publish or deploy the Filtvatt application.
Also read the workspace instructions at
`C:\Users\gobba\OneDrive\Documents\ChatGPT\Filtvätt\AGENTS.md`.

## Collaboration and Git

- Begin and end with `git status --short --branch`.
- Preserve changes from other tasks and do not move or release from an actively
  changing worktree.
- On Windows, use
  `C:\Users\gobba\.codex\bin\codex-git-remote.ps1` for GitHub fetch, pull, and
  push. Never expose the GitHub token.

## What may be distributed

Packages may contain official signed ClamAV databases, Filtvatt YARA-X rules,
and a compatible capa ruleset with complete source and license metadata.
Trellix software, DAT files, credentials, and license material must never be
committed, packaged, or published here.

The production Ed25519 private key is stored only in the GitHub repository
secret `FILTVATT_UPDATE_SIGNING_KEY`. Never add it to Git, artifacts, logs, or a
command line. The matching public key is the verification authority.

## Tests

Use focused tests while editing. Before pushing a change that affects package
contents, paths, signing, verification, or publication, run the complete local
test command. A release must also pass the workflow's own build, verification,
and provenance-attestation steps.

## Publishing definitions

`.github/workflows/release-update.yml` is the production publication path. It
runs on its weekly schedule and may also be started manually with an explicit
channel and minimum compatible Filtvatt version.

Before a manual run:

1. Confirm `main` is clean, pushed, and contains the intended rules and build
   scripts.
2. Choose `stable` or `emergency` deliberately.
3. Set the real minimum compatible Filtvatt version; do not leave a stale
   default without checking product compatibility.
4. Start one workflow run and monitor it to completion. Do not repeatedly rerun
   a failed job without reading the failing step.

The workflow fetches ClamAV and capa from their official sources, builds and
verifies one `.filtvatt-update`, creates provenance attestation, and publishes
an immutable GitHub Release named `definitions-<version>`.

After publication:

1. Confirm the GitHub Release contains the package, `.sha256`, release metadata,
   license files, and notices.
2. Download the published package and checksum, verify SHA-256, and run
   `node scripts/verify-update.mjs <package>`.
3. Confirm the signed sequence is strictly newer and the channel/minimum product
   version are correct.
4. Verify an online Filtvatt installation can discover the release. Installation
   into production still requires the product's normal validation and policy.

The product's static channel at `filtvatt-updates.sajberhagen.com/product/` is a
different release stream. Do not replace its `stable.json` while publishing
definitions.
