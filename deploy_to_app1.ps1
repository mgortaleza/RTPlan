# Deploy NetYX Route Planner to APP1 (app1.netyx.net / 10.1.10.140)
$ErrorActionPreference = "Stop"

$app1Host = "app1.ads.netyx.net"
$app1Ip = "10.1.10.140"
$remoteC = "\\$app1Ip\c$"

Write-Host "=== 1. Validating Access to $app1Host ($app1Ip) ===" -ForegroundColor Cyan
if (!(Test-Path $remoteC)) {
    throw "Cannot access $remoteC. Check network connection or permissions."
}
Write-Host "Connected to $remoteC successfully." -ForegroundColor Green

# 2. Check and Copy JDK if not present
$remoteJdk = "$remoteC\Program Files\Java\jdk-25.0.5.1"
$localJdk = "C:\Program Files\Java\jdk-25.0.5.1"
if (!(Test-Path $remoteJdk)) {
    Write-Host "Copying JDK 25 to $remoteJdk (this may take 1-2 minutes)..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "$remoteC\Program Files\Java" -Force | Out-Null
    Copy-Item -Path $localJdk -Destination "$remoteC\Program Files\Java\" -Recurse -Force
    Write-Host "JDK 25 copied successfully." -ForegroundColor Green
} else {
    Write-Host "JDK 25 already present on APP1." -ForegroundColor Green
}

# 3. Check and Copy Nginx if not present
$remoteNginx = "$remoteC\nginx"
if (!(Test-Path "$remoteNginx\nginx.exe")) {
    Write-Host "Copying Nginx from APPTST to $remoteNginx..." -ForegroundColor Yellow
    if (Test-Path "\\10.1.10.56\c$\nginx") {
        Copy-Item -Path "\\10.1.10.56\c$\nginx" -Destination "$remoteC\" -Recurse -Force
        # Clean logs and temp
        Remove-Item "$remoteNginx\logs\*" -Force -Recurse -ErrorAction SilentlyContinue
        Remove-Item "$remoteNginx\temp\*" -Force -Recurse -ErrorAction SilentlyContinue
    }
}

# 4. Create RTPlanner Directories on APP1
$rtplanDir = "$remoteC\RTPlanner"
$backendDir = "$rtplanDir\backend"
$frontendDir = "$rtplanDir\frontend"
$logsDir = "$rtplanDir\logs"

New-Item -ItemType Directory -Path $backendDir -Force | Out-Null
New-Item -ItemType Directory -Path $frontendDir -Force | Out-Null
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

# 5. Stop running service on APP1 if exists before copying files
Write-Host "=== Stopping services on APP1 if already running ===" -ForegroundColor Cyan
Invoke-Command -ComputerName $app1Host -ScriptBlock {
    Stop-Service RTPlannerBackend -Force -ErrorAction SilentlyContinue
    Stop-Service nginx -Force -ErrorAction SilentlyContinue
}

# 6. Deploy Backend Jar & Native DLL
Write-Host "=== Deploying Backend to APP1 ===" -ForegroundColor Cyan
Copy-Item -Path "C:\dev\RTPlanner\target\rtplan-backend-1.0.0-SNAPSHOT.jar" -Destination "$backendDir\rtplan-backend-1.0.0-SNAPSHOT.jar" -Force
Copy-Item -Path "C:\dev\RTPlanner\mssql-jdbc_auth-13.6.2.x64.dll" -Destination "$backendDir\mssql-jdbc_auth-13.6.2.x64.dll" -Force
Write-Host "Backend JAR and Auth DLL copied." -ForegroundColor Green

# 7. Deploy Frontend Static Assets
Write-Host "=== Deploying Frontend to APP1 ===" -ForegroundColor Cyan
Copy-Item -Path "C:\dev\RTPlanner\frontend\dist\*" -Destination $frontendDir -Recurse -Force
Write-Host "Frontend build deployed." -ForegroundColor Green

# 8. Deploy Nginx Configuration
Write-Host "=== Configuring Nginx on APP1 ===" -ForegroundColor Cyan
$nginxConfContent = @"
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    client_max_body_size 50M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    server {
        listen       80 default_server;
        server_name  map.netyx.net app1.netyx.net app1.ads.netyx.net 10.1.10.140 localhost;

        root   C:/RTPlanner/frontend;
        index  index.html;

        location / {
            try_files `$uri `$uri/ /index.html;
        }

        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        location /api/ {
            proxy_pass         http://127.0.0.1:8080/api/;
            proxy_http_version 1.1;

            proxy_set_header   Host              `$host;
            proxy_set_header   X-Real-IP         `$remote_addr;
            proxy_set_header   X-Forwarded-For   `$proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto `$scheme;

            proxy_connect_timeout 90s;
            proxy_read_timeout    120s;
            proxy_send_timeout    120s;
        }
    }
}
"@
[System.IO.File]::WriteAllText("$remoteNginx\conf\nginx.conf", $nginxConfContent, [System.Text.Encoding]::ASCII)

# 9. Configure WinSW Service for RTPlanner Backend
Write-Host "=== Setting up RTPlanner Windows Service on APP1 ===" -ForegroundColor Cyan
if (Test-Path "$remoteNginx\nginx-service.exe") {
    Copy-Item -Path "$remoteNginx\nginx-service.exe" -Destination "$rtplanDir\rtplan-service.exe" -Force
}

$geminiKey = [System.Environment]::GetEnvironmentVariable('GEMINI_API_KEY', 'User')
$mapsKey = [System.Environment]::GetEnvironmentVariable('GOOGLE_MAPS_API_KEY', 'User')

$rtplanServiceXml = @"
<service>
  <id>RTPlannerBackend</id>
  <name>RTPlanner Backend Service</name>
  <description>NetYX Route Planner Spring Boot Backend</description>
  <executable>C:\Program Files\Java\jdk-25.0.5.1\bin\java.exe</executable>
  <arguments>-Djava.library.path=C:\RTPlanner\backend -jar C:\RTPlanner\backend\rtplan-backend-1.0.0-SNAPSHOT.jar</arguments>
  <workingdirectory>C:\RTPlanner\backend</workingdirectory>
  <env name="GEMINI_API_KEY" value="$geminiKey" />
  <env name="GOOGLE_MAPS_API_KEY" value="$mapsKey" />
  <logpath>C:\RTPlanner\logs</logpath>
  <logmode>roll</logmode>
  <startmode>Automatic</startmode>
</service>
"@
Set-Content -Path "$rtplanDir\rtplan-service.xml" -Value $rtplanServiceXml -Encoding UTF8

# 10. Install / Start Services & Open Firewall on APP1
Write-Host "=== Installing and Starting Services via WinRM on APP1 ===" -ForegroundColor Cyan
Invoke-Command -ComputerName $app1Host -ScriptBlock {
    # Firewall rules
    if (!(Get-NetFirewallRule -DisplayName "HTTP Port 80" -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName "HTTP Port 80" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow | Out-Null
    }
    if (!(Get-NetFirewallRule -DisplayName "RTPlanner Port 8080" -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName "RTPlanner Port 8080" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow | Out-Null
    }

    # Install / Configure Nginx service
    if (!(Get-Service nginx -ErrorAction SilentlyContinue)) {
        & "C:\nginx\nginx-service.exe" install
    }
    Set-Service nginx -StartupType Automatic
    Start-Service nginx -ErrorAction SilentlyContinue

    # Install / Configure RTPlannerBackend service
    if (!(Get-Service RTPlannerBackend -ErrorAction SilentlyContinue)) {
        & "C:\RTPlanner\rtplan-service.exe" install
    }
    Set-Service RTPlannerBackend -StartupType Automatic
    Start-Service RTPlannerBackend -ErrorAction SilentlyContinue
}

Write-Host "=== Waiting 10 seconds for backend initialization... ===" -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 11. Health Checks
Write-Host "=== Verifying Health on APP1 ===" -ForegroundColor Cyan
try {
    $resNginx = Invoke-RestMethod -Uri "http://$app1Ip/" -TimeoutSec 5
    Write-Host "Nginx Frontend: OK" -ForegroundColor Green
} catch {
    Write-Host "Nginx Frontend Warning: $_" -ForegroundColor Yellow
}

try {
    $resApi = Invoke-RestMethod -Uri "http://$app1Ip/api/routes/manifests" -TimeoutSec 10
    Write-Host "Nginx -> Backend API: OK" -ForegroundColor Green
} catch {
    Write-Host "Backend API check: $_" -ForegroundColor Yellow
}

Write-Host "=== Deployment to APP1 Complete! ===" -ForegroundColor Green
Write-Host "URL: http://$app1Ip/" -ForegroundColor Yellow
Write-Host "URL: http://app1.netyx.net/" -ForegroundColor Yellow
