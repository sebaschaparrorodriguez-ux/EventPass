# Endpoints (frontend → n8n)

Todos los endpoints son webhooks de n8n. La base es la variable `VITE_N8N_URL`, o sea:

```
https://<dominio-de-n8n>/webhook/...
```

Todas las respuestas son JSON con la misma forma, para que en el front sea fácil manejarlas:

```json
// bien
{ "ok": true, ... }

// mal (con el status HTTP que corresponda: 400, 401, 403, 404, 409)
{ "ok": false, "error": "CODIGO_DEL_ERROR", "mensaje": "Texto para mostrarle al usuario" }
```

Las operaciones que necesitan usuario logueado reciben el `token` en el body. Ese token lo valida WF02 (ver más abajo).

---

## WF01 · `POST /webhook/ep/usuarios`

| accion | body | respuesta OK |
|---|---|---|
| `crear` | `nombre`, `email`, `password` | `201` `{ ok, usuario: { usuario_id, nombre, email } }` |
| `perfil` | `token` | `200` `{ ok, usuario: { usuario_id, nombre, email, estado, fecha_registro } }` |
| `actualizar` | `token`, `nombre`, opcional `password_actual` + `password_nueva` | `200` `{ ok, usuario }` |
| `desactivar` | `token`, `password` | `200` `{ ok, mensaje }` |

Errores que pueden salir: `DATOS_INVALIDOS` (400), `EMAIL_DUPLICADO` (409), `PASSWORD_INCORRECTO` (401), `SESION_*` (401).

Ejemplo:

```bash
curl -X POST "$N8N/webhook/ep/usuarios" -H "Content-Type: application/json" \
  -d '{"accion":"crear","nombre":"Ana Gómez","email":"ana@correo.com","password":"clave1234"}'
```

## WF02 · `POST /webhook/ep/auth`

| accion | body | respuesta OK |
|---|---|---|
| `login` | `email`, `password` | `200` `{ ok, token, expira_en, usuario }` |
| `logout` | `token` | `200` `{ ok, mensaje }` (si ya estaba cerrada también responde ok) |
| `validar` | `token` | `200` `{ ok, usuario }` o `401` |

Errores: `CREDENCIALES` (401), `USUARIO_INACTIVO` (403), `SESION_NO_EXISTE` / `SESION_CERRADA` / `SESION_EXPIRADA` / `SESION_USUARIO_INACTIVO` (401).

## WF03 · `POST /webhook/ep/telegram`

| accion | body | respuesta OK |
|---|---|---|
| `solicitar` | `token` | `201` `{ ok, codigo, expira_en }` |
| `estado` | `token` | `200` `{ ok, vinculado, telegram_username, fecha_vinculacion }` |

Después el usuario le escribe al bot `/vincular CODIGO` (eso entra por el Telegram Trigger, no por la web).

## WF05 · `GET /webhook/ep/catalogo`

Es público, no pide token.

| query | uso |
|---|---|
| `tipo=LISTADO` | todos los eventos publicables |
| `tipo=FILTRO&categoria=Cultura` | filtrados por categoría |
| `tipo=DETALLE&evento_id=EVT-0001` | un solo evento (404 si no existe) |
| `visitor_id=VIS-XXXX` | id anónimo del navegador, se guarda en el log |

Cada evento viene con los campos de la hoja más estos calculados:

```json
{
  "confirmados": 3,
  "en_espera": 1,
  "cupos_disponibles": 0,
  "inscripcion_abierta": true
}
```

## WF06 · `POST /webhook/ep/inscripciones`

| accion | body | respuesta OK |
|---|---|---|
| `crear` | `token`, `evento_id`, opcional `nombre_acreditacion`, `observaciones` | `201` `{ ok, inscripcion }` con estado `CONFIRMADA` o `LISTA_ESPERA` |
| `mis` | `token` | `200` `{ ok, inscripciones: [...] }` (cada una trae el evento y `posicion_espera`) |
| `actualizar` | `token`, `inscripcion_id`, `nombre_acreditacion` y/o `observaciones` | `200` |
| `cancelar` | `token`, `inscripcion_id` | `200` |

Errores al crear: `TELEGRAM_NO_VINCULADO` (403), `USUARIO_INACTIVO` (403), `EVENTO_NO_EXISTE` (404), `EVENTO_NO_DISPONIBLE` / `EVENTO_PASADO` / `INSCRIPCION_DUPLICADA` (409).

## WF10 · Chat

No es un endpoint que yo llame con fetch: lo usa el widget `@n8n/chat` contra la URL del Chat Trigger (`VITE_N8N_CHAT_URL`). En `metadata` el widget manda `visitor_id` y, si hay sesión, el `token`.

## Lo que NO es endpoint

- **WF04** se maneja con el formulario de n8n: `https://<dominio-de-n8n>/form/ep-admin-eventos` (solo admin).
- **WF07** y **WF08** corren solos con Schedule Trigger.
- **WF09** es un sub-workflow, solo lo llaman otros workflows.
