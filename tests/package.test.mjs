import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

test("byggaren skapar ett paket som den fristående verifieraren godkänner", async () => {
  const root = await mkdtemp(resolve(process.cwd(), ".package-test-"));
  try {
    for (const name of ["clamav", "capa", "yara", "output"]) await mkdir(resolve(root, name));
    await writeFile(resolve(root, "clamav", "main.cvd"), "main"); await writeFile(resolve(root, "clamav", "daily.cvd"), "daily");
    await writeFile(resolve(root, "capa", "test-doppelgänging.yml"), "rule:\n  meta:\n    name: test\n");
    await writeFile(resolve(root, "yara", "test.yar"), "rule test { condition: false }\n");
    const pair = generateKeyPairSync("ed25519"); const privatePath = resolve(root, "private.pem"); const publicPath = resolve(root, "public.pem");
    await writeFile(privatePath, pair.privateKey.export({ type: "pkcs8", format: "pem" }));
    await writeFile(publicPath, pair.publicKey.export({ type: "spki", format: "pem" }));
    const built = spawnSync(process.execPath, ["scripts/build-update.mjs", "--clamav", resolve(root, "clamav"), "--capa", resolve(root, "capa"), "--yara", resolve(root, "yara"), "--key", privatePath, "--output", resolve(root, "output"), "--version", "test.1", "--sequence", "123"], { cwd: process.cwd(), encoding: "utf8" });
    assert.equal(built.status, 0, built.stderr);
    const packagePath = resolve(root, "output", "filtvatt-update-test.1.filtvatt-update");
    assert.ok((await readFile(packagePath)).length > 0);
    const verified = spawnSync(process.execPath, ["scripts/verify-update.mjs", packagePath, publicPath], { cwd: process.cwd(), encoding: "utf8" });
    assert.equal(verified.status, 0, verified.stderr); assert.match(verified.stdout, /UPDATE_VERIFY_PASS version=test\.1 sequence=123 components=3/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
