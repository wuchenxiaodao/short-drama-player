# Short Drama Platform - One-click Deployment Script (Windows PowerShell)
# Usage:
#   .\deploy.ps1          (default: start)
#   .\deploy.ps1 start    (build & start services)
#   .\deploy.ps1 stop     (stop all services)
#   .\deploy.ps1 status   (show service status & port mappings)

$ErrorActionPreference = "Stop"

function Write-Info($msg)  { Write-Host "[INFO] $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)   { Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Step($msg)  { Write-Host "`n>>> $msg" -ForegroundColor Cyan }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$Action = if ($args.Count -gt 0) { $args[0].ToLower() } else { "start" }

if ($Action -notin @("start", "stop", "status")) {
    Write-Err "Unknown action: $Action"
    Write-Host "Usage: .\deploy.ps1 [start|stop|status]" -ForegroundColor White
    exit 1
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

function Check-DockerDesktop {
    Write-Step "Checking Docker Desktop..."

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Err "Docker is not installed. Please install Docker Desktop first:"
        Write-Host "       https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor White
        exit 1
    }

    try {
        $null = docker info 2>&1
        Write-Info "Docker Desktop is running."
    } catch {
        Write-Err "Docker Desktop is NOT running. Please start Docker Desktop first."
        Write-Host "       You can start it from the Start Menu or system tray." -ForegroundColor White
        exit 1
    }

    $composeCmd = Get-DockerComposeCmd
    if (-not $composeCmd) {
        Write-Err "Docker Compose is not available. Please ensure Docker Desktop includes Compose."
        exit 1
    }

    return $composeCmd
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

    Write-Step "Generating self-signed SSL certificate..."

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
        if (Test-Path ".env.example") {
            Write-Step "Creating .env file from .env.example..."
            Copy-Item ".env.example" ".env"
            Write-Warn "Created .env with default values. For production, please update passwords and secrets!"
        } else {
            Write-Warn ".env.example not found. Creating minimal .env file..."
            @"
MYSQL_ROOT_PASSWORD=drama_root_2024
MYSQL_DATABASE=short_drama
MYSQL_USER=drama
MYSQL_PASSWORD=drama_pass_2024
REDIS_PASSWORD=drama_redis_2024
JWT_SECRET=mySecretKeyForJwtTokenGeneration2024
SPRING_PROFILES_ACTIVE=prod
NEXT_PUBLIC_API_BASE_URL=http://backend:8080
"@ | Set-Content -Path ".env" -Encoding UTF8
            Write-Warn "Created minimal .env with default values. For production, please update passwords and secrets!"
        }
    } else {
        Write-Info ".env file already exists, skipping."
    }
}

function Build-And-Start {
    $composeCmd = Get-DockerComposeCmd

    Write-Step "Building Docker images..."
    Invoke-Expression "$composeCmd build"
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Docker build failed."
        exit 1
    }

    Write-Step "Starting services..."
    Invoke-Expression "$composeCmd up -d"
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to start services."
        exit 1
    }
}

function Stop-Services {
    $composeCmd = Get-DockerComposeCmd

    Write-Step "Stopping all services..."
    Invoke-Expression "$composeCmd down"
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to stop services."
        exit 1
    }
    Write-Info "All services stopped."
}

function Wait-ForHealthy {
    Write-Step "Waiting for services to become healthy..."
    $maxWait = 180
    $elapsed = 0
    $interval = 10

    while ($elapsed -lt $maxWait) {
        $allHealthy = $true

        foreach ($service in @("mysql", "redis", "backend", "frontend", "nginx")) {
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
    Write-Warn "Check status with: .\deploy.ps1 status"
}

function Show-Status {
    $composeCmd = Get-DockerComposeCmd

    Write-Step "Service Status"
    Write-Host ""

    $containers = @(
        @{ Name = "drama-mysql";   Service = "MySQL";   Port = "3306" },
        @{ Name = "drama-redis";   Service = "Redis";   Port = "6379" },
        @{ Name = "drama-backend"; Service = "Backend";  Port = "8080" },
        @{ Name = "drama-frontend"; Service = "Frontend"; Port = "3000" },
        @{ Name = "drama-nginx";   Service = "Nginx";    Port = "80, 443" }
    )

    Write-Host ("{0,-18} {1,-12} {2,-10} {3}" -f "CONTAINER", "STATUS", "PORT(S)", "HEALTH") -ForegroundColor White
    Write-Host ("{0,-18} {1,-12} {2,-10} {3}" -f "---------", "------", "-------", "------") -ForegroundColor DarkGray

    foreach ($c in $containers) {
        $exists = docker ps -a --filter "name=$($c.Name)" --format "{{.Names}}" 2>$null
        if ($exists) {
            $state = docker inspect --format='{{.State.Status}}' $c.Name 2>$null
            $health = docker inspect --format='{{.State.Health.Status}}' $c.Name 2>$null
            if (-not $health) { $health = "N/A" }

            $statusColor = if ($state -eq "running") { "Green" } else { "Red" }
            $healthColor = switch ($health) {
                "healthy" { "Green" }
                "unhealthy" { "Red" }
                "starting" { "Yellow" }
                default { "DarkGray" }
            }

            $stateDisplay = if ($state -eq "running") { "Running" } else { "Stopped" }
            Write-Host ("{0,-18} " -f $c.Name) -NoNewline
            Write-Host ("{0,-12} " -f $stateDisplay) -ForegroundColor $statusColor -NoNewline
            Write-Host ("{0,-10} " -f $c.Port) -NoNewline
            Write-Host ("{0}" -f $health) -ForegroundColor $healthColor
        } else {
            Write-Host ("{0,-18} " -f $c.Name) -NoNewline
            Write-Host ("{0,-12} " -f "Not Created") -ForegroundColor DarkGray -NoNewline
            Write-Host ("{0,-10} " -f $c.Port) -NoNewline
            Write-Host ("{0}" -f "-") -ForegroundColor DarkGray
        }
    }

    Write-Host ""
    Write-Host "Port Mappings:" -ForegroundColor Cyan
    Write-Host "  MySQL    -> localhost:3306" -ForegroundColor White
    Write-Host "  Redis    -> localhost:6379" -ForegroundColor White
    Write-Host "  Backend  -> localhost:8080" -ForegroundColor White
    Write-Host "  Frontend -> localhost:3000" -ForegroundColor White
    Write-Host "  Nginx    -> localhost:80 (HTTP) / 443 (HTTPS)" -ForegroundColor White
    Write-Host ""
}

function Show-AccessInfo {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress
    if (-not $ip) { $ip = "localhost" }

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  Short Drama Platform - Deployment Complete!" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Local access:   " -NoNewline; Write-Host "https://localhost" -ForegroundColor Green
    Write-Host "  Network access: " -NoNewline; Write-Host "https://$ip" -ForegroundColor Green
    Write-Host ""
    Write-Host "  API endpoint:   " -NoNewline; Write-Host "https://localhost/api/" -ForegroundColor White
    Write-Host "  Video endpoint: " -NoNewline; Write-Host "https://localhost/video/" -ForegroundColor White
    Write-Host ""
    Write-Host "  Note: Browser will show a security warning" -ForegroundColor Yellow
    Write-Host "        for the self-signed certificate." -ForegroundColor Yellow
    Write-Host "        Click 'Advanced' -> 'Proceed' to continue." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Useful commands:" -ForegroundColor White
    Write-Host "    Start:   .\deploy.ps1 start" -ForegroundColor White
    Write-Host "    Stop:    .\deploy.ps1 stop" -ForegroundColor White
    Write-Host "    Status:  .\deploy.ps1 status" -ForegroundColor White
    Write-Host "    Logs:    docker compose logs -f" -ForegroundColor White
    Write-Host "============================================" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Short Drama Platform - Deployment Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

switch ($Action) {
    "start" {
        $composeCmd = Check-DockerDesktop
        Generate-Cert
        Create-Htpasswd
        Create-Env
        Build-And-Start
        Wait-ForHealthy
        Show-AccessInfo
    }
    "stop" {
        $composeCmd = Check-DockerDesktop
        Stop-Services
    }
    "status" {
        Show-Status
    }
}
