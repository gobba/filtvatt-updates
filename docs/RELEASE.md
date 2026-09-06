# Definition release operations

Manual publication requires an explicit user request and the integration mandate
described in [AGENTS.md](../AGENTS.md). Reuse an existing authorization for the
same scope. Do not start a competing release while another release task owns it.


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
