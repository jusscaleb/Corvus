$pythonExe = Get-Command -Name python.exe -ErrorAction SilentlyContinue | 
    Where-Object { $_.Source -like "$env:SystemRoot*" } | 
    Select-Object -ExpandProperty Source -First 1

if (-not $pythonExe) {
    $pythonExe = Get-ChildItem -Path $env:SystemRoot -Filter "python.exe" -Recurse -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty FullName -First 1
}

if (-not $pythonExe) {
    Write-Error "Python executable was not found in the Windows directory ($env:SystemRoot)."
    exit 1
}

Write-Host "Found Python at: $pythonExe" -ForegroundColor Green

Write-Host "Creating virtual environment 'core'..." -ForegroundColor Cyan
& $pythonExe -m venv core

$venvActivate = Join-Path -Path (Get-Location) -ChildPath "core\Scripts\Activate.ps1"

if (Test-Path $venvActivate) {
    Write-Host "Activating virtual environment..." -ForegroundColor Cyan
    & $venvActivate
} else {
    Write-Error "Failed to locate activation script at $venvActivate."
    exit 1
}

if (Test-Path "requirements.txt") {
    Write-Host "Installing dependencies from requirements.txt..." -ForegroundColor Cyan
    pip install -r requirements.txt
} else {
    Write-Warning "requirements.txt not found in the current directory. Skipping pip install."
}

$envFile = Join-Path -Path (Get-Location) -ChildPath ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file..." -ForegroundColor Cyan
    New-Item -Path $envFile -ItemType File -Force | Out-Null
}

$envContent = Get-Content -Path $envFile -Raw -ErrorAction SilentlyContinue

if ($envContent -notmatch "SECRET_KEY\s*=\s*.+") {
    Write-Host "Generating cryptographically secure Django SECRET_KEY..." -ForegroundColor Cyan
    $newSecretKey = python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
    
    if ($newSecretKey) {
        if ($envContent -match "SECRET_KEY\s*=") {
            $updatedContent = $envContent -replace "SECRET_KEY\s*=.*", "SECRET_KEY=$newSecretKey"
            Set-Content -Path $envFile -Value $updatedContent -NoNewline
        } else {
            Add-Content -Path $envFile -Value "`nSECRET_KEY=$newSecretKey"
        }
        Write-Host "SECRET_KEY successfully configured in .env!" -ForegroundColor Green
    } else {
        Write-Warning "Could not auto-generate SECRET_KEY via Python. Ensure django is installed."
    }
} else {
    Write-Host "SECRET_KEY already present in .env." -ForegroundColor Yellow
}

if (Test-Path "manage.py") {
    Write-Host "Running Django database migrations..." -ForegroundColor Cyan
    python manage.py migrate
} else {
    Write-Warning "manage.py not found in the current directory. Skipping migrations."
}

Write-Host "Setup complete!" -ForegroundColor Green