import { createHash, createPublicKey, verify } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import { posix, resolve } from "node:path";
import { extract, list } from "tar";

const packagePath = resolve(process.argv[2] ?? ""); const publicKeyPath = resolve(process.argv[3] ?? "keys/filtvatt-update-signing-public.pem");
if (!process.argv[2]) throw new Error("Användning: node scripts/verify-update.mjs paket.filtvatt-update [public.pem]");
const root = resolve("dist", `.verify-${process.pid}`); await rm(root, { recursive: true, force: true }); await mkdir(root, { recursive: true });
try {
  const entries = new Map(); let count = 0;
  await list({ file: packagePath, strict: true, onReadEntry: (entry) => {
    count += 1;
    if (count > 20_000 || !entry.path || entry.path.startsWith("/") || entry.path.includes("\\") || posix.normalize(entry.path) !== entry.path
      || entry.path.split("/").includes("..") || (entry.type !== "File" && entry.type !== "Directory") || entries.has(entry.path)) {
      entry.resume(); throw new Error(`Otillåten arkivpost: ${entry.path}`);
    }
    entries.set(entry.path, { type: entry.type, size: entry.size }); entry.resume();
  } });
  if (entries.get("manifest.json")?.type !== "File" || entries.get("manifest.sig")?.type !== "File") throw new Error("Paketet saknar signerat manifest.");
  await extract({ file: packagePath, cwd: root, strict: true, preservePaths: false });
  const manifestBytes = await readFile(resolve(root, "manifest.json")); const signature = await readFile(resolve(root, "manifest.sig"));
  if (!verify(null, manifestBytes, createPublicKey(await readFile(publicKeyPath)), signature)) throw new Error("Manifestsignaturen är ogiltig.");
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  if (manifest.schema !== "filtvatt.update" || manifest.version !== 1 || !Array.isArray(manifest.components)) throw new Error("Manifestformatet är ogiltigt.");
  const declared = manifest.components.flatMap((component) => component.files);
  const declaredPaths = new Set(declared.map((file) => file.path));
  const actualPaths = [...entries.entries()].filter(([, entry]) => entry.type === "File").map(([path]) => path).filter((path) => path !== "manifest.json" && path !== "manifest.sig");
  if (declaredPaths.size !== declared.length || actualPaths.length !== declared.length || actualPaths.some((path) => !declaredPaths.has(path))) throw new Error("Paketets filer stämmer inte med manifestet.");
  for (const file of declared) {
    if (!/^[A-Za-z0-9._/-]+$/.test(file.path) || file.path.split("/").includes("..") || entries.get(file.path)?.size !== file.size) throw new Error(`Ogiltig filpost: ${file.path}`);
    const hash = createHash("sha256"); for await (const chunk of createReadStream(resolve(root, file.path))) hash.update(chunk);
    if (hash.digest("hex") !== file.sha256) throw new Error(`SHA-256 stämmer inte för ${file.path}`);
  }
  process.stdout.write(`UPDATE_VERIFY_PASS sequence=${manifest.sequence} components=${manifest.components.length}\n`);
} finally { await rm(root, { recursive: true, force: true }); }
