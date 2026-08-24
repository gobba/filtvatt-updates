rule Filtvatt_EICAR_Test_File : test malware
{
  meta:
    description = "EICAR antivirus integration test string"
    severity = "critical"
  strings:
    $eicar = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*" ascii
  condition:
    $eicar
}

rule Filtvatt_Suspicious_PowerShell_Download_Execute : script downloader
{
  meta:
    description = "PowerShell download-and-execute chain"
    severity = "critical"
  strings:
    $ps = "powershell" ascii wide nocase
    $download1 = "DownloadString" ascii wide nocase
    $download2 = "Invoke-WebRequest" ascii wide nocase
    $execute1 = "Invoke-Expression" ascii wide nocase
    $execute2 = "IEX(" ascii wide nocase
  condition:
    $ps and 1 of ($download*) and 1 of ($execute*)
}
