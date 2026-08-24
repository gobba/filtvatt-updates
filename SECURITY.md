# Säkerhet

Rapportera sårbarheter privat genom GitHubs **Security advisories** i stället för ett publikt issue.

Acceptera aldrig ett paket enbart för att det ligger på GitHub. Filtvätt verifierar manifestets Ed25519-signatur, filernas SHA-256, ClamAVs utgivarsignatur, versionsordning och motorernas provkörningar före aktivering.

Produktionsnyckeln får inte läggas i repositoryt, workflowloggar eller releasefiler. Vid misstänkt nyckelkompromiss ska publicering stoppas och en ny Filtvätt-version med roterad förtroendenyckel ges ut.
