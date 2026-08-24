# Tredjepartsnotiser

Paketbyggaren hämtar följande komponenter utan att ändra deras licenser:

- **ClamAV official signature databases**, Cisco Talos. CVD/CLD-filerna återpubliceras oförändrade, behåller sina officiella digitala signaturer och hämtas med FreshClam från `database.clamav.net`. ClamAVs dokumentation beskriver privat spegling; kontrollera alltid aktuella upstreamvillkor innan en annan distributionsform används.
- **capa-rules**, Mandiant/Google, Apache License 2.0. Releaseversionen måste ha samma huvudversion som capa-motorn i Filtvätt.
- **tar**, npm-paketet som skapar och verifierar arkivet, BlueOak-1.0.0.

Filtvätts egna YARA-X-regler är AGPL-3.0-or-later. Trellix-program och DAT-filer ingår aldrig.

Den här filen är en inventering, inte en ersättning för respektive komponents fullständiga licens och notiser.
