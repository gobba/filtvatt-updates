# Filtvätt Updates

Det här repositoryt bygger och publicerar verifierbara definitionspaket för [Filtvätt](https://github.com/gobba/filtvatt). En onlineinstallation hämtar senaste release automatiskt. I ett offlinenät laddar en administratör upp samma paket under **Administration → Installera motoruppdatering**; den uppdateringstjänsten saknar nätverk.

En release innehåller en fil med ändelsen `.filtvatt-update`, SHA-256 och GitHub-proveniens. Paketet innehåller:

- officiella, signerade ClamAV-databaser hämtade med FreshClam;
- Filtvätts egna YARA-X-regler;
- den capa-regelversion som passar produktens capa-huvudversion;
- ett Ed25519-signerat manifest med källa, licens, version, byggtid, storlek och SHA-256 för varje fil.

Trellix-motor, licens och DAT-filer publiceras aldrig här. De hämtas och hanteras av den licensierade organisationen.

## Hämta ett paket

Öppna [senaste releasen](https://github.com/gobba/filtvatt-updates/releases/latest) och hämta `.filtvatt-update`-filen. Checksumman och GitHubs byggattestering är extra transportkontroller; Filtvätt verifierar dessutom paketets inbyggda signatur och varje ClamAV-databas före installation.

## Bygga lokalt

Byggskriptet kräver Node.js 24 eller senare, en katalog med ClamAVs `main`, `daily` och eventuell `bytecode`, ett kompatibelt capa-regelträd och en Ed25519-nyckel i PKCS#8 PEM-format:

```sh
npm ci
node scripts/build-update.mjs \
  --clamav ./staging/clamav \
  --capa ./staging/capa-rules \
  --yara ./rules/yara \
  --key /skyddad/plats/update-signing-private.pem \
  --output ./dist \
  --version 2026.08.24.1 \
  --sequence 1787551200
```

Den privata produktionsnyckeln finns inte i repositoryt. GitHub-workflowen läser den från repositoryhemligheten `FILTVATT_UPDATE_SIGNING_KEY`.

## Licenser

Koden i repositoryt är AGPL-3.0-or-later. Inkluderade regel- och databasfiler behåller respektive upphovsmans licens och anges i paketmanifestet samt i [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
