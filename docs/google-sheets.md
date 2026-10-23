# Estructura de Google Sheets

Cada workflow principal tiene su propio archivo (no hay un "archivo gigante" con todo). Un workflow puede **leer** de otro archivo cuando lo necesita, pero lo que registra lo guarda en el suyo.

Los 10 archivos se crean con el workflow **WF00_crear_hojas_y_datos_prueba**: se ejecuta una sola vez y deja los encabezados exactos y los datos de prueba.

| Archivo | Hojas | Lo escribe | Lo leen además |
|---|---|---|---|
| EP01_Usuarios | Usuarios, Auditoria_Usuarios, Verificaciones_Email | WF01 | WF02, WF06, WF09 |
| EP02_Sesiones | Sesiones | WF02 | – |
| EP03_Telegram | Codigos_Vinculacion, Vinculaciones | WF03 | WF06, WF09 |
| EP04_Eventos | Eventos, Auditoria_Eventos | WF04 | WF05, WF06, WF07, WF08, WF10 |
| EP05_Catalogo_Log | Consultas_Catalogo | WF05 | – |
| EP06_Inscripciones | Inscripciones, Auditoria_Inscripciones | WF06, WF07 (cambia LISTA_ESPERA → CONFIRMADA) | WF04, WF05, WF08, WF10 |
| EP07_Reasignaciones | Reasignaciones | WF07 | – |
| EP08_Recordatorios | Recordatorios | WF08 | – |
| EP09_Notificaciones | Notificaciones | WF09 | – |
| EP10_Soporte | Conversaciones, Mensajes | WF10 | – |

## Columnas

**EP01_Usuarios / Usuarios**
`usuario_id, nombre, email_normalizado, password_hash, password_salt, estado, fecha_registro, fecha_actualizacion, avisos_email, avisos_telegram`
Las dos últimas son extra (SI/NO): `avisos_email` es si también quiere los avisos por correo; `avisos_telegram` siempre queda en SI porque Telegram es obligatorio.

**EP01_Usuarios / Auditoria_Usuarios**
`auditoria_id, usuario_id, accion, fecha, resultado, detalle`

**EP01_Usuarios / Verificaciones_Email** _(extra, para verificar el correo al registrarse)_
`verificacion_id, email_normalizado, codigo_hash, creado_en, expira_en, estado, intentos, usado_en`
Estados: `PENDIENTE`, `USADO`, `EXPIRADO`, `CANCELADO`. El código no se guarda, solo `sha256(email:codigo)`.

**EP02_Sesiones / Sesiones**
`session_id, usuario_id, session_token, creada_en, expira_en, estado, cerrada_en, ultima_validacion`

**EP03_Telegram / Codigos_Vinculacion**
`codigo_id, usuario_id, codigo, creado_en, expira_en, estado, usado_en`

**EP03_Telegram / Vinculaciones**
`vinculacion_id, usuario_id, chat_id, telegram_username, fecha_vinculacion, estado`

**EP04_Eventos / Eventos**
`evento_id, nombre, categoria, descripcion, fecha, hora, lugar, capacidad, imagen_url, organizador, estado, fecha_creacion, fecha_actualizacion`

**EP04_Eventos / Auditoria_Eventos**
`auditoria_id, evento_id, accion, fecha, resultado, detalle`

**EP05_Catalogo_Log / Consultas_Catalogo**
`consulta_id, fecha, tipo, evento_id, categoria, resultado_count, visitor_id, status_http`

**EP06_Inscripciones / Inscripciones**
`inscripcion_id, usuario_id, evento_id, estado, fecha_inscripcion, fecha_actualizacion, nombre_acreditacion, observaciones, origen, orden_espera`

**EP06_Inscripciones / Auditoria_Inscripciones**
`auditoria_id, inscripcion_id, usuario_id, evento_id, accion, estado_anterior, estado_nuevo, fecha, resultado, detalle`

**EP07_Reasignaciones / Reasignaciones**
`reasignacion_id, evento_id, inscripcion_id, usuario_id, fecha, orden_lista, estado_anterior, estado_nuevo, resultado_notificacion`

**EP08_Recordatorios / Recordatorios**
`recordatorio_id, usuario_id, evento_id, inscripcion_id, tipo_recordatorio, fecha_programada, fecha_envio, estado, clave_idempotencia`

**EP09_Notificaciones / Notificaciones**
`notificacion_id, usuario_id, tipo, titulo, mensaje, evento_id, inscripcion_id, fecha, gmail_estado, telegram_estado, gmail_error, telegram_error, clave_idempotencia`

**EP10_Soporte / Conversaciones**
`conversation_id, usuario_id, visitor_id, fecha_inicio, fecha_ultima_interaccion, estado`

**EP10_Soporte / Mensajes**
`message_id, conversation_id, usuario_id, visitor_id, rol, mensaje, timestamp`

## Detalles que me tocó tener en cuenta

- Todo se escribe en modo **RAW** para que Sheets no convierta las fechas ni los IDs a su formato.
- Las fechas van en ISO con zona de Colombia, ej: `2026-10-21T15:30:00-05:00`. Así se pueden comparar en los Code nodes sin líos.
- `fecha` y `hora` del evento van separadas (`2026-11-07` y `16:00`), porque así las pide el enunciado y así llegan del formulario.
- Los nodos de lectura tienen **Execute Once** y **Always Output Data**: si la hoja está vacía el flujo no se corta, y si llegan varios items no se lee la misma hoja varias veces.
