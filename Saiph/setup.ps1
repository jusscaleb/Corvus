Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Setting up Sirius AI Agent..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Locate system Python executable
$pythonExe = Get-Command -Name python.exe -ErrorAction SilentlyContinue | 
    Where-Object { $_.Source -like "$env:SystemRoot*" } | 
    Select-Object -ExpandProperty Source -First 1

if (-not $pythonExe) {
    $pythonExe = Get-ChildItem -Path $env:SystemRoot -Filter "python.exe" -Recurse -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty FullName -First 1
}

if (-not $pythonExe) {
    $pythonExe = (Get-Command -Name python.exe -ErrorAction SilentlyContinue).Source
}

if (-not $pythonExe) {
    Write-Error "Python executable was not found on your system."
    exit 1
}

Write-Host "Found Python at: $pythonExe" -ForegroundColor Green

# Create dedicated virtual environment for Sirius
$venvDir = Join-Path -Path (Get-Location) -ChildPath "venv"
if (-not (Test-Path $venvDir)) {
    Write-Host "Creating virtual environment 'venv' for Sirius..." -ForegroundColor Cyan
    & $pythonExe -m venv venv
} else {
    Write-Host "Virtual environment 'venv' already exists." -ForegroundColor Yellow
}

$venvActivate = Join-Path -Path $venvDir -ChildPath "Scripts\Activate.ps1"

if (Test-Path $venvActivate) {
    Write-Host "Activating virtual environment..." -ForegroundColor Cyan
    & $venvActivate
} else {
    Write-Error "Failed to locate activation script at $venvActivate."
    exit 1
}

# Install Sirius dependencies
if (Test-Path "requirements.txt") {
    Write-Host "Installing Sirius dependencies from requirements.txt..." -ForegroundColor Cyan
    pip install --upgrade pip
    pip install -r requirements.txt
} else {
    Write-Warning "requirements.txt not found in current directory. Skipping pip install."
}

# Configure .env file
$envFile = Join-Path -Path (Get-Location) -ChildPath ".env"
$backendEnv = Join-Path -Path (Get-Location) -ChildPath "..\Backend\.env"

if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file for Sirius..." -ForegroundColor Cyan
    
    # If Backend/.env exists and has GROQ_API_KEY, copy it over automatically
    $backendGroqKey = ""
    if (Test-Path $backendEnv) {
        $backendContent = Get-Content -Path $backendEnv -Raw -ErrorAction SilentlyContinue
        if ($backendContent -match "GROQ_API_KEY\s*=\s*([^\r\n]+)") {
            $backendGroqKey = $matches[1].Trim()
        }
    }

    $defaultEnv = @"
GROQ_API_KEY=$backendGroqKey
GROQ_MODEL=llama-3.3-70b-versatile
BACKEND_BASE_URL=http://127.0.0.1:8000/api
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB_NAME=corvus_chats
"@
    Set-Content -Path $envFile -Value $defaultEnv
    Write-Host ".env successfully generated for Sirius!" -ForegroundColor Green
} else {
    Write-Host ".env already exists." -ForegroundColor Yellow
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host " Sirius setup complete!" -ForegroundColor Green
Write-Host " Run interactive CLI test with:" -ForegroundColor Cyan
Write-Host "   python -m main" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Green
