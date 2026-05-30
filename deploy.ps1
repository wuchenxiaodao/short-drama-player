# Short Drama Platform - One-click Deployment Script (Windows PowerShell)
# Run: .\deploy.ps1

$ErrorActionPreference = "Stop"

function Write-Info($msg)  { Write-Host "[INFO] $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)   { Write-Host "[ERROR] $msg" -ForegroundColor Red }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

function Check-Prerequisites {
    Write-Info "Checking prerequisites..."

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Err "Docker is not installed. Please install Docker Desktop first: https://docs.docker.com/desktop/install/windows-install/"
        exit 1
    }

    try {
        docker info | Out-Null
    } catch {
        Write-Err "Docker daemon is not running. Please start Docker Desktop first."
        exit 1
    }

    $composeCmd = Get-DockerComposeCmd
    if (-not $composeCmd) {
        Write-Err "Docker Compose is not available. Please ensure Docker Desktop includes Compose."
        exit 1
    }

    if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
        Write-Warn "openssl not found in PATH. Will try to generate certificate using Git's openssl."
        $gitOpenssl = Get-GitOpenssl
        if (-not $gitOpenssl) {
            Write-Warn "Cannot find openssl. You may need to generate SSL certificates manually."
        }
    }

    Write-Info "All prerequisites satisfied."
}

function Get-DockerComposeCmd {
    try {
        docker compose version | Out-Null
        return "docker compose"
    } catch {}

    try {
        docker-compose version | Out-Null
        return "docker-compose"
    } catch {}

    return $null
}

function Get-GitOpenssl {
    $gitPath = Get-Command git -ErrorAction SilentlyContinue
    if ($gitPath) {
        $gitDir = Split-Path (Split-Path $gitPath.Source)
        $opensslPath = Join-Path $gitDir "usr\bin\openssl.exe"
        if (Test-Path $opensslPath) {
            return $opensslPath
        }
    }
    return $null
}

function Generate-Cert {
    if ((Test-Path "nginx\certs\cert.pem") -and (Test-Path "nginx\certs\key.pem")) {
        Write-Info "SSL certificates already exist, skipping generation."
        return
    }

    Write-Info "Generating self-signed SSL certificate..."

    $certsDir = "nginx\certs"
    if (-not (Test-Path $certsDir)) {
        New-Item -ItemType Directory -Path $certsDir -Force | Out-Null
    }

    $opensslCmd = Get-Command openssl -ErrorAction SilentlyContinue
    if (-not $opensslCmd) {
        $opensslCmd = Get-GitOpenssl
    }

    if ($opensslCmd) {
        & $opensslCmd req -x509 -nodes `
            -days 365 `
            -newkey rsa:2048 `
            -keyout "nginx\certs\key.pem" `
            -out "nginx\certs\cert.pem" `
            -subj "/C=CN/ST=Local/L=Local/O=ShortDrama/OU=Dev/CN=localhost" `
            -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"

        if ($LASTEXITCODE -eq 0) {
            Write-Info "SSL certificate generated successfully."
        } else {
            Write-Warn "Failed to generate certificate with openssl. Trying PowerShell method..."
            Generate-CertPS
        }
    } else {
        Generate-CertPS
    }
}

function Generate-CertPS {
    Write-Info "Generating self-signed certificate using PowerShell..."

    $cert = New-SelfSignedCertificate `
        -DnsName "localhost" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -FriendlyName "ShortDrama Dev HTTPS" `
        -NotAfter (Get-Date).AddDays(365) `
        -KeyExportPolicy Exportable

    $certPath = "Cert:\CurrentUser\My\$($cert.Thumbprint)"

    Export-Certificate -Cert $certPath -FilePath "nginx\certs\cert.pem" -Type CERT | Out-Null

    $keyBytes = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::ExportRSAPrivateKeyPem($cert)
    Set-Content -Path "nginx\certs\key.pem" -Value $keyBytes -NoNewline

    Remove-Item $certPath

    Write-Info "SSL certificate generated using PowerShell."
}

function Create-Htpasswd {
    if (-not (Test-Path "nginx\.htpasswd")) {
        New-Item -ItemType File -Path "nginx\.htpasswd" -Force | Out-Null
        Write-Info "Created empty .htpasswd file (basic auth disabled by default)."
    }
}

function Create-Env {
    if (-not (Test-Path ".env")) {
        Write-Info "Creating .env file from .env.example..."
        Copy-Item ".env.example" ".env"
        Write-Warn "Created .env with default values. For production, please update passwords and secrets!"
    } else {
        Write-Info ".env file already exists, skipping."
    }
}

function Build-And-Start {
    $composeCmd = Get-DockerComposeCmd

    Write-Info "Building Docker images..."
    Invoke-Expression "$composeCmd build"
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Docker build failed."
        exit 1
    }

    Write-Info "Starting services..."
    Invoke-Expression "$composeCmd up -d"
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to start services."
        exit 1
    }
}

function Wait-ForHealthy {
    Write-Info "Waiting for services to become healthy..."
    $maxWait = 180
    $elapsed = 0
    $interval = 10

    while ($elapsed -lt $maxWait) {
        $allHealthy = $true

        foreach ($service in @("mysql", "redis", "backend", "nextjs", "nginx")) {
            $containerName = "drama-$service"
            try {
                $status = docker inspect --format='{{.State.Health.Status}}' $containerName 2>$null
                if ($status -ne "healthy") {
                    $allHealthy = $false
                    break
                }
            } catch {
                $allHealthy = $false
                break
            }
        }

        if ($allHealthy) {
            Write-Info "All services are healthy!"
            return
        }

        Write-Info "Waiting... (${elapsed}s / ${maxWait}s)"
        Start-Sleep -Seconds $interval
        $elapsed += $interval
    }

    Write-Warn "Timeout waiting for services. Some services may not be healthy yet."
    Write-Warn "Check status with: docker compose ps"
}

function Show-AccessInfo {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress
    if (-not $ip) { $ip = "localhost" }

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  Short Drama Platform - Deployment Complete!" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Local access:   https://localhost"
    Write-Host "  Network access: https://$ip"
    Write-Host ""
    Write-Host "  API endpoint:   https://localhost/api/"
    Write-Host "  Video endpoint: https://localhost/video/"
    Write-Host ""
    Write-Host "  Note: Browser will show a security warning"
    Write-Host "        for the self-signed certificate."
    Write-Host "        Click 'Advanced' -> 'Proceed' to continue."
    Write-Host ""
    Write-Host "  Useful commands:"
    Write-Host "    View logs:      docker compose logs -f"
    Write-Host "    Stop services:  docker compose down"
    Write-Host "    Restart:        docker compose restart"
    Write-Host "============================================" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Short Drama Platform - Deployment Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Check-Prerequisites
Generate-Cert
Create-Htpasswd
Create-Env
Build-And-Start
Wait-ForHealthy
Show-AccessInfo
