# EventPass Barrio

**Estudiante:** Joan Sebastian Chaparro Rodriguez
**Estudiante:** Gabriela Silva
**Proyecto integrador:** desarrollo web + servicios HTTP + IA aplicada + automatización con n8n

**App publicada:** _pendiente (se agrega cuando quede el deploy en Vercel)_

---

## ¿Qué es?

EventPass Barrio es mi versión de EventPass: una página para inscribirse a los planes que arma la comunidad del barrio en temporada navideña. Le di una identidad de **Navidad colombiana**: novenas de aguinaldos, noche de velitas, alumbrados, buñuelos y natilla, el torneo de fin de año y el bazar de los emprendedores.

Desde la página se puede:

- ver el catálogo de eventos sin cuenta y filtrarlo por categoría
- registrarse, iniciar y cerrar sesión
- ver y editar el perfil, cambiar la contraseña o desactivar la cuenta
- vincular Telegram con un código
- inscribirse a un evento (si está lleno se entra a lista de espera)
- ver, editar y cancelar las inscripciones
- hablar con un asistente que responde dudas (solo informa, no hace cambios)

Y de forma automática:

- cuando alguien cancela, el cupo pasa al que lleva más tiempo en la lista de espera
- llegan recordatorios 24 horas y 2 horas antes del evento
- todas las notificaciones salen por **Gmail y Telegram** al mismo tiempo

Los eventos los administra solo el administrador, con un formulario de n8n.

---

## Arquitectura

```
 Página en Vercel (React)
        │  fetch (JSON)          widget de chat
        ▼                              ▼
 ┌──────────────────────── n8n ─────────────────────────┐
 │ Webhooks  ·  Form Trigger  ·  Schedule  ·  Telegram   │
 │ Chat Trigger  ·  Execute Sub-workflow                 │
 │                                                      │
 │ validaciones · reglas del negocio · estados ·        │
 │ idempotencia · auditoría                              │
 └───────────┬───────────────────────────┬──────────────┘
             ▼                           ▼
     Google Sheets (EP01…EP10)   Gmail · Telegram · Gemini
```

La regla principal que seguí: **el frontend es solo un cliente**. No tiene ninguna credencial ni toca Google Sheets; todo lo pide a n8n por HTTP, y n8n decide si se puede o no.

---

## Tecnologías

| Parte | Qué usé |
|---|---|
| Frontend | React 19 + Vite, React Router, CSS a mano |
| Chat | `@n8n/chat` (widget oficial de n8n) |
| Hosting del front | Vercel |
| Backend / lógica | n8n 2.41 (local, publicado con ngrok) |
| Persistencia | Google Sheets (10 archivos) |
| Notificaciones | Gmail + bot de Telegram |
| IA | Google Gemini 2.5 Flash con el nodo AI Agent |

---

## Workflows

Están exportados desde mi instancia de n8n en la carpeta [`n8n/`](n8n/).

| Workflow | Trigger | Google Sheets | Qué hace |
|---|---|---|---|
| WF01_usuarios_crud | Webhook `POST ep/usuarios` | EP01_Usuarios | crear, perfil, actualizar, desactivar |
| WF02_auth_sesiones | Webhook `POST ep/auth` + Execute Sub-workflow Trigger | EP02_Sesiones | login, logout, validar sesión |
| WF03_vinculacion_telegram | Webhook `POST ep/telegram` + Telegram Trigger | EP03_Telegram | código de vinculación y `/vincular` |
| WF04_eventos_crud | n8n Form Trigger | EP04_Eventos | CRUD de eventos (admin) |
| WF05_catalogo_publico | Webhook `GET ep/catalogo` | EP05_Catalogo_Log | listado, detalle, filtro y cupos |
| WF06_inscripciones_crud | Webhook `POST ep/inscripciones` | EP06_Inscripciones | crear, mis, actualizar, cancelar |
| WF07_reasignacion_lista_espera | Schedule (cada 2 min) | EP07_Reasignaciones | promueve la lista de espera |
| WF08_recordatorios | Schedule (cada 15 min) | EP08_Recordatorios | recordatorios 24 h y 2 h |
| WF09_notificaciones | Execute Sub-workflow Trigger | EP09_Notificaciones | envío central Gmail + Telegram |
| WF10_eventpass_assistant | Chat Trigger | EP10_Soporte | asistente con Gemini |
| WF00_crear_hojas_y_datos_prueba _(adicional)_ | Webhook `GET ep-setup-hojas` | crea EP01…EP10 | setup inicial, se corre una vez |

Cómo se llaman entre ellos:

- WF01, WF03, WF06 y WF10 llaman a **WF02** como sub-workflow para validar el token.
- WF04, WF06, WF07 y WF08 llaman a **WF09** para notificar.

El detalle de columnas de cada hoja está en [`docs/google-sheets.md`](docs/google-sheets.md).

---

## Comunicación frontend → n8n

En [`src/api.js`](src/api.js) hay una sola función `llamar()` que usan todas las pantallas:

1. arma la URL con `VITE_N8N_URL` + `/webhook/...`
2. manda JSON (`POST`) o query string (`GET` en el catálogo)
3. agrega el header `ngrok-skip-browser-warning`, porque ngrok gratis mete una página de aviso si no va
4. si la respuesta trae `ok: false` o un status de error, lanza un error con el `mensaje` que mandó n8n, y la pantalla lo muestra

Los webhooks tienen **Allowed Origins (CORS)** habilitado, si no el navegador bloquea las peticiones desde Vercel.

Cada pantalla maneja sus tres estados: **cargando** (spinner), **error** (caja roja con botón de reintentar) y **éxito** (caja verde o el contenido).

## Endpoints

Resumen (con ejemplos completos en [`docs/api.md`](docs/api.md)):

| Método | Ruta | Acciones |
|---|---|---|
| POST | `/webhook/ep/usuarios` | `crear`, `perfil`, `actualizar`, `desactivar` |
| POST | `/webhook/ep/auth` | `login`, `logout`, `validar` |
| POST | `/webhook/ep/telegram` | `solicitar`, `estado` |
| GET | `/webhook/ep/catalogo` | `tipo=LISTADO \| FILTRO \| DETALLE` |
| POST | `/webhook/ep/inscripciones` | `crear`, `mis`, `actualizar`, `cancelar` |
| POST | `/webhook/<id>/chat` | chat del asistente (lo usa el widget) |
| – | `/form/ep-admin-eventos` | formulario del administrador |

---

## Estados

| Entidad | Estados |
|---|---|
| Usuario | `ACTIVO`, `INACTIVO` |
| Sesión | `ACTIVA`, `CERRADA`, `EXPIRADA` |
| Código de vinculación | `PENDIENTE`, `USADO`, `EXPIRADO`, `CANCELADO` |
| Vinculación Telegram | `ACTIVA`, `INACTIVA` |
| Evento | `BORRADOR`, `PUBLICADO`, `CERRADO`, `CANCELADO` |
| Inscripción | `CONFIRMADA`, `LISTA_ESPERA`, `CANCELADA` |
| Recordatorio | `PENDIENTE`, `ENVIADO`, `ERROR`, `OMITIDO` |
| Canal de notificación | `PENDIENTE`, `ENVIADO`, `ERROR`, `NO_APLICA` |
| Conversación | `ABIERTA`, `CERRADA` |
| Rol de mensaje | `USER`, `ASSISTANT`, `SYSTEM` |

**No se borra nada físicamente.** Desactivar una cuenta la pasa a `INACTIVO`, cancelar un evento lo pasa a `CANCELADO` y cancelar una inscripción la pasa a `CANCELADA`. Todo cambio importante queda además en la hoja de auditoría de su archivo.

---

## Hash de contraseñas

En WF01, el Code node **"Generar hash y salt"** hace esto:

```js
const salt = crypto.randomBytes(16).toString('hex')
const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex')
```

- cada usuario tiene su **propia sal aleatoria**, así dos personas con la misma clave quedan con hashes distintos
- PBKDF2 con 100.000 iteraciones hace que probar claves por fuerza bruta sea lento
- en la hoja solo quedan `password_hash` y `password_salt`; la contraseña nunca se guarda

En el login (WF02, nodo **"Verificar password"**) se recalcula el hash con la sal guardada y se compara con `crypto.timingSafeEqual`. Si el correo no existe o la clave está mal, el mensaje es el mismo ("Correo o contraseña incorrectos"), para no revelar qué correos están registrados.

Para que el Code node pueda usar `require('crypto')`, n8n se arranca con `NODE_FUNCTION_ALLOW_BUILTIN=crypto` (está en `n8n/iniciar-n8n.ps1`).

## Sesiones

No usé JWT. En el login se genera un token aleatorio (`crypto.randomBytes(24)`, 48 caracteres hex) y se guarda en `EP02_Sesiones` con `expira_en` = ahora + 8 horas.

El front guarda el token en `localStorage` y lo manda en cada operación privada. Cualquier workflow que necesite saber quién es el usuario llama al sub-workflow de validación de WF02, que revisa en este orden:

1. que el token exista → si no, `NO_EXISTE`
2. que no esté `CERRADA` (logout)
3. que no haya pasado `expira_en` → si pasó, la marca `EXPIRADA` en la hoja
4. que el usuario siga `ACTIVO`

Si todo está bien, actualiza `ultima_validacion` y devuelve el usuario. Si no, el workflow que llamó responde `401` y el front cierra la sesión local y manda al login.

## Idempotencia

Que repetir la misma acción no duplique cosas:

- **Inscripciones:** antes de crear se busca si ya existe una inscripción no cancelada con el mismo `usuario_id + evento_id`. Si existe, responde `409 INSCRIPCION_DUPLICADA` y no escribe nada. Además el botón se deshabilita mientras se envía.
- **Registro:** el correo se normaliza (minúsculas, sin espacios) y no se permite repetido.
- **Recordatorios:** cada uno tiene `clave_idempotencia = usuario_id|evento_id|tipo_recordatorio`. Si esa clave ya está en `EP08_Recordatorios`, no se vuelve a mandar aunque el Schedule corra cada 15 minutos.
- **Notificaciones:** WF09 arma una clave con `tipo|usuario|evento|inscripción` y si ya hay una enviada con esa clave no la repite.
- **Códigos de Telegram:** un código `USADO` no sirve otra vez, y al pedir uno nuevo los `PENDIENTE` anteriores pasan a `CANCELADO`.
- **Logout:** cerrar una sesión ya cerrada responde ok igual.

## Lista de espera y reasignación

**Cupos disponibles = capacidad − inscripciones CONFIRMADAS.** No hay ningún campo de "cupos" escrito a mano: siempre se calcula (en WF05, WF06 y WF07).

- Al inscribirse, si hay cupo queda `CONFIRMADA`; si no, queda `LISTA_ESPERA` con su `orden_espera` (informativo).
- Al cancelar una confirmada, el cupo queda libre.
- **WF07** corre cada 2 minutos: para cada evento `PUBLICADO` y futuro calcula cupos libres, toma la lista de espera, la **ordena por `fecha_inscripcion` ascendente** (nodo Sort) y promueve solo a los primeros N.

Ejemplo: 2 cupos libres y 5 en espera → el 1 y el 2 pasan a `CONFIRMADA`; el 3, 4 y 5 siguen esperando.

Cada promoción se guarda en `EP07_Reasignaciones` (con el resultado de la notificación), queda en la auditoría de inscripciones y se notifica por WF09.

## Servicio central de notificaciones (WF09)

Ningún workflow manda correos ni mensajes por su cuenta: todos llaman a WF09 con `usuario_id, tipo, titulo, mensaje, evento_id, inscripcion_id`.

WF09:

1. busca el correo del usuario (EP01) y su `chat_id` (EP03)
2. revisa que no sea un duplicado (clave de idempotencia)
3. manda el **Gmail**. El nodo tiene la salida de error activada: si falla, se anota `ERROR` con el mensaje y **se sigue**
4. manda el **Telegram**, igual con su propia salida de error. Si el usuario no tiene Telegram queda `NO_APLICA`
5. guarda una fila en `EP09_Notificaciones` con `gmail_estado` y `telegram_estado` por separado

Así un fallo de Gmail no esconde lo que pasó con Telegram, ni al revés.

Tipos que se mandan: `INSCRIPCION_CONFIRMADA`, `INGRESO_LISTA_ESPERA`, `INSCRIPCION_CANCELADA`, `REASIGNACION_CUPO`, `RECORDATORIO_24H`, `RECORDATORIO_2H`, `EVENTO_CANCELADO`, `EVENTO_ACTUALIZADO` (cuando el admin cambia fecha, hora o lugar).

## Asistente IA (WF10)

Es el globito de chat abajo a la derecha. Usa el widget `@n8n/chat` contra un **Chat Trigger** público.

Cómo funciona:

1. el `conversation_id` se genera con un hash del `sessionId` del widget (`CNV-XXXX`)
2. si el usuario tiene sesión, el widget manda el token y se valida con WF02; si no, se usa el `visitor_id`
3. se leen los eventos y las inscripciones **en modo solo lectura** y se arma un contexto con datos reales (cupos, fechas, lugares y las inscripciones del usuario si está logueado)
4. el AI Agent con **Gemini** responde usando ese contexto, con memoria de los últimos mensajes de esa conversación
5. se guarda la conversación en `Conversaciones` y **cada mensaje** (`USER`, `ASSISTANT` y uno `SYSTEM` al inicio) en `Mensajes`. Filtrando por `conversation_id` se reconstruye la conversación completa.

**Restricciones:** el asistente no tiene ninguna tool conectada, entonces aunque quisiera no podría escribir nada. Además el prompt le dice que no puede crear usuarios, iniciar sesión, inscribir, cancelar, modificar eventos, cambiar cupos ni estados, que no invente datos y que no pida contraseñas. Si le piden algo de eso, explica cómo hacerlo en la página.

---

## Variables de entorno

Archivo [`.env.example`](.env.example):

| Variable | Para qué |
|---|---|
| `VITE_N8N_URL` | URL base de n8n (sin `/` al final) |
| `VITE_N8N_CHAT_URL` | URL del Chat Trigger de WF10 |
| `VITE_TELEGRAM_BOT` | usuario del bot, sin `@` (para el botón "Abrir bot") |

Ninguna es secreta: son URLs públicas. Los secretos (OAuth de Google, token del bot, API key de Gemini) **solo están dentro de las credenciales de n8n** y no se suben al repo.

---

## Cómo correrlo

### 1. n8n

1. Tener n8n instalado (`npm install -g n8n`) y [ngrok](https://ngrok.com) con su authtoken configurado.
2. Arrancar con el script, que deja la zona horaria de Bogotá, habilita `crypto` y abre ngrok:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\n8n\iniciar-n8n.ps1 -Dominio tu-dominio.ngrok-free.dev
   ```
3. En n8n crear las credenciales: Google Sheets OAuth2, Gmail OAuth2, Telegram API y Google Gemini API.
4. Importar los JSON de `n8n/`, asignarles las credenciales y ejecutar una vez **WF00** para crear las hojas.
5. Poner los IDs de las hojas nuevas en los nodos de Google Sheets y activar WF01 a WF10.

### 2. Frontend

```bash
npm install
cp .env.example .env    # y llenar las URLs
npm run dev
```

### 3. Deploy

En Vercel: importar el repo, framework **Vite**, y agregar las tres variables `VITE_*` en *Settings → Environment Variables*. El `vercel.json` redirige todas las rutas a `index.html` para que funcione React Router al recargar.

### Administrar eventos

Abrir `https://<dominio-de-n8n>/form/ep-admin-eventos`, elegir la acción (CREAR, CONSULTAR, ACTUALIZAR, CANCELAR o CERRAR) y llenar los campos.

---

## Datos de prueba

9 eventos navideños en 5 categorías (con cupos, lleno, próximo, cancelado, cerrado y un borrador) y 3 usuarios de prueba. Todo explicado en [`docs/datos-de-prueba.md`](docs/datos-de-prueba.md), junto con la prueba completa de lista de espera.

## Estructura del repo

```
/
├── src/                 código del frontend (React)
│   ├── pages/           pantallas
│   ├── components/      navbar, tarjetas, estados, chat
│   ├── api.js           todas las llamadas a n8n
│   └── auth.jsx         manejo de la sesión en el navegador
├── public/              favicon e ilustraciones de categorías
├── n8n/                 workflows exportados (.json) + script para arrancar n8n
├── docs/                endpoints, estructura de hojas, datos de prueba
├── .env.example
└── README.md
```
