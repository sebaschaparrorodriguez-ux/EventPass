# Arranca n8n local con la config que necesita EventPass y lo publica con ngrok.
# Uso:  .\n8n\iniciar-n8n.ps1                (usa el dominio de abajo)
#       .\n8n\iniciar-n8n.ps1 -Dominio otro-dominio.ngrok-free.dev
# (el authtoken de ngrok se configura una sola vez con: ngrok config add-authtoken TU_TOKEN)
param(
  [string]$Dominio = $(if ($env:EP_NGROK_DOMAIN) { $env:EP_NGROK_DOMAIN } else { 'repaint-overcast-droop.ngrok-free.dev' })
)

$env:GENERIC_TIMEZONE = 'America/Bogota'
$env:TZ = 'America/Bogota'
# los Code nodes usan require('crypto') para el hash de contraseñas y los tokens
$env:NODE_FUNCTION_ALLOW_BUILTIN = 'crypto'
# ngrok queda como proxy delante de n8n
$env:N8N_PROXY_HOPS = '1'

# ngrok puede estar en el PATH o suelto en el escritorio
$ngrok = (Get-Command ngrok -ErrorAction SilentlyContinue).Source
if (-not $ngrok -and (Test-Path "$env:USERPROFILE\Desktop\ngrok.exe")) { $ngrok = "$env:USERPROFILE\Desktop\ngrok.exe" }

if ($Dominio -and $ngrok) {
  # con esto los webhooks, el chat y el Telegram Trigger se registran con la URL publica
  $env:WEBHOOK_URL = "https://$Dominio/"
  Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
  Write-Host "Abriendo ngrok en https://$Dominio ..." -ForegroundColor Cyan
  Start-Process -FilePath $ngrok -ArgumentList @('http', "--url=$Dominio", '5678') -WindowStyle Minimized
} else {
  Write-Host 'Sin ngrok o sin dominio: n8n solo va a funcionar en localhost.' -ForegroundColor Yellow
}

n8n start
