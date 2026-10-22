# Datos de prueba y cómo probar

## Eventos

8 eventos en 5 categorías (el enunciado pide mínimo 6 en 3):

| ID | Evento | Categoría | Fecha | Cap. | Estado | Para qué está |
|---|---|---|---|---|---|---|
| EVT-0001 | Rock al Parque del Barrio | Cultura | 2026-11-07 16:00 | 80 | PUBLICADO | **con cupos disponibles** |
| EVT-0002 | Torneo relámpago de microfútbol | Deportes | 2026-10-31 09:00 | 3 | PUBLICADO | **evento lleno** (3 confirmados de prueba) |
| EVT-0003 | Mercado de emprendedores de la cuadra | Emprendimiento | 2026-10-24 10:00 | 40 | PUBLICADO | **próximo a realizarse** (dispara recordatorios) |
| EVT-0004 | Cine al aire libre: noche de terror | Cultura | 2026-10-30 19:00 | 60 | CANCELADO | **evento cancelado** |
| EVT-0005 | Taller de huerta urbana | Educación | 2026-10-18 10:00 | 20 | CERRADO | **evento cerrado** |
| EVT-0006 | Minga de limpieza del caño | Comunidad | 2026-11-01 08:00 | 30 | PUBLICADO | con cupos |
| EVT-0007 | Clases de salsa en la plazoleta | Educación | 2026-11-04 18:30 | 25 | PUBLICADO | con cupos |
| EVT-0008 | Bazar navideño | Emprendimiento | 2026-12-12 15:00 | 50 | BORRADOR | no debe salir en el catálogo |

Si cuando se revise ya pasó la fecha del "próximo", se le cambia la fecha desde el formulario de WF04 (acción ACTUALIZAR) y listo.

## Usuarios de prueba

Contraseña de los tres: `Vecino2026*`

| Usuario | Correo |
|---|---|
| Marta Rodríguez | marta.vecina@example.com |
| Don Julio Pérez | julio.tienda@example.com |
| Camila Torres | camila.torres@example.com |

Usan correos `example.com` a propósito: WF09 no les manda Gmail (queda `NO_APLICA`) para no generar rebotes. Tampoco tienen Telegram vinculado.

Los tres tienen cupo CONFIRMADO en el torneo (EVT-0002), por eso está lleno.

## Prueba completa de lista de espera

1. Crear una cuenta propia en la página, con un correo real.
2. Ir a **Mi perfil → Generar código** y mandarle al bot `/vincular CODIGO`.
3. Inscribirse al torneo (EVT-0002) → queda en **LISTA_ESPERA** y llegan correo + Telegram.
4. En otra ventana (incógnito) entrar con `marta.vecina@example.com` / `Vecino2026*` y cancelar su inscripción al torneo.
5. Esperar máximo 2 minutos → WF07 sube la cuenta propia a **CONFIRMADA** y llega el aviso por los dos canales.
6. Revisar `EP07_Reasignaciones`, `EP06_Inscripciones / Auditoria_Inscripciones` y `EP09_Notificaciones`.

## Otras pruebas rápidas

- Registrarse dos veces con el mismo correo → `409 EMAIL_DUPLICADO`.
- Inscribirse dos veces al mismo evento → `409 INSCRIPCION_DUPLICADA` (idempotencia).
- Inscribirse sin Telegram vinculado → `403 TELEGRAM_NO_VINCULADO`.
- Usar el mismo código de vinculación dos veces → el bot responde que ya fue usado.
- Preguntarle al asistente "inscríbeme al torneo" → explica que no puede hacerlo y dice cómo hacerlo en la página.
