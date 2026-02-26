# 44AracTakip - PowerShell Launcher
$ErrorActionPreference = "Continue"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   44AracTakip - Akilli Arac Yonetimi" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Eski oturumlari temizle (Port 4011)
Write-Host "[1/3] Eski oturumlar kontrol ediliyor..." -ForegroundColor Yellow
$portProcess = Get-NetTCPConnection -LocalPort 4011 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($portProcess) {
    Write-Host "Port 4011 kullaniliyor (PID: $portProcess). Kapatiliyor..." -ForegroundColor Cyan
    Stop-Process -Id $portProcess -Force -ErrorAction SilentlyContinue
}

# 2. Lock dosyasini temizle
Write-Host "[2/3] Kilit dosyalari temizleniyor..." -ForegroundColor Yellow
$lockFile = "c:\Cursor\44aractakip\.next\dev\lock"
if (Test-Path $lockFile) {
    Remove-Item -Path $lockFile -Force -ErrorAction SilentlyContinue
    Write-Host "Lock dosyasi silindi." -ForegroundColor Green
}

# 3. Uygulamayi baslat
Write-Host "[3/3] Uygulama baslatiliyor..." -ForegroundColor Yellow
Set-Location "c:\Cursor\44aractakip"

if (!(Test-Path "package.json")) {
    Write-Host "[HATA] Proje klasoru bulunamadi: c:\Cursor\44aractakip" -ForegroundColor Red
    Read-Host "Devam etmek icin Enter'a basin..."
    exit
}

Write-Host "Tarayici aciliyor: http://localhost:4011" -ForegroundColor Cyan
Start-Process "http://localhost:4011"

Write-Host ""
Write-Host "UYARI: Bu pencere sunucuyu calistirir. KAPATMAYINIZ!" -ForegroundColor White -BackgroundColor DarkRed
Write-Host "---------------------------------------------------"
Write-Host ""

# npm run dev
npm run dev -- -p 4011

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[HATA] Sunucu baslatilamadi!" -ForegroundColor Red
    Read-Host "Hata detaylarini gormek icin Enter'a basin..."
}
