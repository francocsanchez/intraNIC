param(
    [int]$Port = 4002,
    [switch]$Start
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$serverPath = (Resolve-Path (Join-Path $repoRoot "server")).Path

function Stop-ProcessIfRunning {
    param(
        [int]$ProcessId,
        [string]$Reason
    )

    if ($ProcessId -le 0 -or $ProcessId -eq $PID) {
        return
    }

    $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if (-not $process) {
        return
    }

    Write-Host ("[stop] PID {0} ({1}) - {2}" -f $ProcessId, $process.ProcessName, $Reason)
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

$targetPids = New-Object 'System.Collections.Generic.HashSet[int]'

$portConnections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -gt 0 }

foreach ($connection in $portConnections) {
    [void]$targetPids.Add([int]$connection.OwningProcess)
}

$backendProcesses = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
        $_.ProcessId -gt 0 -and
        $_.CommandLine -and
        $_.CommandLine -like "*$serverPath*"
    }

foreach ($process in $backendProcesses) {
    [void]$targetPids.Add([int]$process.ProcessId)
}

if ($targetPids.Count -eq 0) {
    Write-Host ("[ok] No encontre procesos viejos del backend en {0}." -f $serverPath)
} else {
    foreach ($targetPid in $targetPids) {
        $reason = if ($portConnections | Where-Object { $_.OwningProcess -eq $targetPid }) {
            "ocupando el puerto $Port"
        } else {
            "proceso del backend en $serverPath"
        }

        Stop-ProcessIfRunning -ProcessId $targetPid -Reason $reason
    }

    Start-Sleep -Milliseconds 500
    $remaining = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
        Where-Object { $_.State -eq "Listen" -and $_.OwningProcess -gt 0 }

    if ($remaining) {
        Write-Host ("[warn] El puerto {0} sigue ocupado por PID {1}." -f $Port, ($remaining[0].OwningProcess))
    } else {
        Write-Host ("[ok] Backend limpiado. El puerto {0} quedo libre." -f $Port)
    }
}

if ($Start) {
    Write-Host "[start] Levantando backend limpio en una nueva ventana..."
    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$serverPath'; npm run dev"
    )
}
