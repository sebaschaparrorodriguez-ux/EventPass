# Arranca n8n local con la config que necesita EventPass y lo publica con ngrok.
# Uso:  .\n8n\iniciar-n8n.ps1 -Dominio tu-dominio.ngrok-free.app
# (el authtoken de ngrok se configura una sola vez con: ngrok config add-authtoken TU_TOKEN)
param(
  [string]$Dominio = $env:EP_NGROK_DOMAIN
)

$env:GENERIC_TIMEZONE = 'America/Bogota'
$env:TZ = 'America/Bogota'
# los Code nodes usan require('crypto') para el hash de contraseñas y los tokens
$env:NODE_FUNCTION_ALLOW_BUILTIN = 'crypto'
# ngrok queda como proxy delante de n8n
$env:N8N_PROXY_HOPS = '1'

if ($Dominio) {
  # con esto los webhooks, el chat y el Telegram Trigger se registran con la URL publica
  $env:WEBHOOK_URL = "https://$Dominio/"
  Write-Host "Abriendo ngrok en https://$Dominio ..." -ForegroundColor Cyan
  Start-Process -FilePath 'ngrok' -ArgumentList @('http', "--url=$Dominio", '5678') -WindowStyle Minimized
} else {
  Write-Host 'Sin dominio de ngrok: n8n solo va a funcionar en localhost.' -ForegroundColor Yellow
}

n8n start
