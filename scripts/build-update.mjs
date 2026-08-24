import { createHash, createPrivateKey, sign } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, posix, resolve, relative, sep } from "node:path";
import { create } from "tar";

function argumentsMap(values) {
  const parsed = new Map();
  for (let index = 0; index < values.length; index += 2) {
    const name = values[index]; const value = values[index + 1];
    if (!name?.startsWith("--") || !value) throw new Error(`Ogiltigt argument: ${name ?? "saknas"}`);
    parsed.set(name.slice(2), value);
  }
  return parsed;
}

function required(map, name) {
  const value = map.get(name); if (!value) throw new Error(`--${name} måste anges.`); return value;
}

async function filesBelow(root, accepted) {
  const output = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symboliska länkar tillåts inte: ${path}`);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && accepted(entry.name)) output.push(path);
    }
  }
  await walk(root); return output.sort();
}

async function sha256(path) {
  const hash = createHash("sha256"); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest("hex");
}

async function copyComponentFiles(sourceRoot, destinationRoot, prefix, accepted, acceptedPath = () => true) {
  const files = [];
  for (const source of await filesBelow(sourceRoot, accepted)) {
    const suffix = relative(sourceRoot, source).split(sep).join(posix.sep);
    if (!acceptedPath(suffix)) continue;
    const packagePath = `${prefix}/${suffix}`; const target = resolve(destinationRoot, packagePath);
    if (!/^[A-Za-z0-9._/-]+$/.test(packagePath) || packagePath.split("/").includes("..")) throw new Error(`Otillåten sökväg i komponenten: ${packagePath}`);
    await mkdir(resolve(target, ".."), { recursive: true });
    const bytes = await readFile(source); await writeFile(target, bytes, { mode: 0o644, flag: "wx" });
    files.push({ path: packagePath, sha256: await sha256(target), size: bytes.length });
  }
  return files;
}

const args = argumentsMap(process.argv.slice(2));
const clamavRoot = resolve(required(args, "clamav")); const capaRoot = resolve(required(args, "capa")); const yaraRoot = resolve(required(args, "yara"));
const keyPath = resolve(required(args, "key")); const outputRoot = resolve(required(args, "output"));
const releaseVersion = required(args, "version"); const sequence = Number(required(args, "sequence"));
if (!Number.isSafeInteger(sequence) || sequence <= 0) throw new Error("--sequence måste vara ett positivt heltal.");

const stage = resolve(outputRoot, `.stage-${process.pid}`); await rm(stage, { recursive: true, force: true }); await mkdir(stage, { recursive: true });
try {
  const clamavFiles = await copyComponentFiles(clamavRoot, stage, "clamav", (name) => /^(main|daily|bytecode)\.(cvd|cld)$/.test(name));
  if (!clamavFiles.some((file) => /^clamav\/main\./.test(file.path)) || !clamavFiles.some((file) => /^clamav\/daily\./.test(file.path))) throw new Error("ClamAV main och daily krävs.");
  const yaraFiles = await copyComponentFiles(yaraRoot, stage, "yara", (name) => /\.yar[a]?$/.test(name));
  const capaFiles = await copyComponentFiles(capaRoot, stage, "capa-rules", (name) => /\.ya?ml$/.test(name), (path) => path.split("/").every((segment) => !segment.startsWith(".")));
  if (yaraFiles.length === 0 || capaFiles.length === 0) throw new Error("YARA- och capa-regler måste finnas.");

  const createdAt = new Date().toISOString();
  const manifest = {
    schema: "filtvatt.update", version: 1, sequence,
    channel: args.get("channel") === "emergency" ? "emergency" : "stable",
    createdAt, minFiltvattVersion: args.get("minimum") ?? "1.2.0",
    components: [
      { id: "clamav", kind: "clamav", version: args.get("clamav-version") ?? releaseVersion, builtAt: args.get("clamav-built-at") ?? createdAt, license: "ClamAV official signature database", source: "https://database.clamav.net/", files: clamavFiles },
      { id: "filtvatt-yara", kind: "yara-x-rules", version: releaseVersion, builtAt: createdAt, license: "AGPL-3.0-or-later", source: "https://github.com/gobba/filtvatt-updates", files: yaraFiles },
      { id: "capa-rules", kind: "capa-rules", version: args.get("capa-version") ?? "9.4.0", builtAt: createdAt, license: "Apache-2.0", source: "https://github.com/mandiant/capa-rules", files: capaFiles },
    ],
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(resolve(stage, "manifest.json"), manifestBytes, { mode: 0o644, flag: "wx" });
  const privateKey = createPrivateKey(await readFile(keyPath));
  await writeFile(resolve(stage, "manifest.sig"), sign(null, manifestBytes, privateKey), { mode: 0o644, flag: "wx" });

  await mkdir(outputRoot, { recursive: true });
  const packageName = `filtvatt-update-${releaseVersion}.filtvatt-update`; const packagePath = resolve(outputRoot, packageName);
  await rm(packagePath, { force: true });
  const archiveFiles = ["manifest.json", "manifest.sig", ...manifest.components.flatMap((component) => component.files.map((file) => file.path))];
  await create({ cwd: stage, file: packagePath, portable: true, noMtime: true, gzip: false, strict: true }, archiveFiles);
  const packageSha = await sha256(packagePath);
  await writeFile(resolve(outputRoot, `${packageName}.sha256`), `${packageSha}  ${packageName}\n`, { mode: 0o644 });
  await writeFile(resolve(outputRoot, "release-info.json"), `${JSON.stringify({ version: releaseVersion, sequence, createdAt, package: packageName, sha256: packageSha }, null, 2)}\n`, { mode: 0o644 });
  process.stdout.write(`${packagePath}\n`);
} finally { await rm(stage, { recursive: true, force: true }); }
