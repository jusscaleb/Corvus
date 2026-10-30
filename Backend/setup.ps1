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

if (Test-Path "manage.py") {
    Write-Host "Running Django database migrations..." -ForegroundColor Cyan
    python manage.py migrate
} else {
    Write-Warning "manage.py not found in the current directory. Skipping migrations."
}

Write-Host "Setup complete!" -ForegroundColor Green