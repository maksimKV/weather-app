# PowerShell script to run ESLint on src directory
Write-Host "Running ESLint on src directory..." -ForegroundColor Green
npx eslint src --ext .js,.ts,.svelte 