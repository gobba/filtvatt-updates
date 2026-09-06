# Filtvatt definition repository instructions

Canonical remote: `https://github.com/gobba/filtvatt-updates.git`; base: `main`.
This repository publishes scanner data, not the Filtvatt application. These
rules are self-contained and do not require a personal Windows workspace.

## Collaboration and delivery

- Verify `origin` and run `git status --short --branch` at task start, before
  committing or publishing, and at handoff. Preserve other tasks' changes.
- Start implementation from current `origin/main` on a named task branch.
  Use a separate worktree when work is parallel or the checkout belongs to
  another task. Never move or commit a shared dirty worktree with active writers.
- Unless the user requests local-only work, commit only finished task-owned
  changes, integrate current `origin/main`, push the branch, and open a PR.
  Read-only tasks need no PR. A PR does not authorize merging or deployment.
- Only an explicitly designated integration or release task may merge or write
  directly to `main`. Being the last active task grants no integration mandate.
  If mixed changes exist, preserve them and prepare a handoff; the designated
  integrator collects writer handoffs and reviews the complete diff once idle.
- Deployment, manual publication and release require an explicit user request.
  Reuse authorization already given for the same scope; finish independent
  authorized preparation before asking about a genuinely missing decision.
- Handoff: PR URL, head commit, branch/worktree, push state, checks run and
  deliberately omitted, material risks, dependencies/merge order, and excluded
  or uncommitted files. Name the integration owner, or state that none is assigned.
  If delivery is blocked, report the completed portion and remaining work;
  do not describe an unpushed or unverified implementation as fully complete.
- Exclude caches, build output, credentials, private keys and temporary files
  from commits. Stop only task-owned temporary processes/services at completion;
  preserve shared Docker, VPS and user services unless their operation was requested.

## What may be distributed

Packages may contain official signed ClamAV databases, Filtvatt YARA-X rules,
and a compatible capa ruleset with complete source and license metadata.
Trellix software, DAT files, credentials, and license material must never be
committed, packaged, or published here.

The production Ed25519 private key is stored only in the GitHub repository
secret `FILTVATT_UPDATE_SIGNING_KEY`. Never add it to Git, artifacts, logs, or a
command line. The matching public key is the verification authority.

## Runtime and verification

Use Node.js 24. On the documented Windows host, follow the global runtime and
GitHub transport instructions; on other hosts use normal supported local tools.
Read [README.md](README.md) for commands and [release operations](docs/RELEASE.md)
only for definition publication.

Use focused tests while editing. Documentation-only changes need diff/link review,
not the full suite. Before pushing changes to package contents, paths, signing,
verification or publication, run the complete local test command. Release also
requires the workflow's build, verification and provenance-attestation checks.
Reuse passing checks with unchanged inputs; expand only for new changes or findings.
