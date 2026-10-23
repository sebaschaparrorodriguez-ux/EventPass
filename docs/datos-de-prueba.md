# Datos de prueba y cómo probar

La temática de esta versión es **la Navidad en el barrio** (estilo colombiano: novenas, velitas, alumbrados, buñuelos y natilla), así que los eventos de prueba son planes de fin de año.

## Eventos

9 eventos en 5 categorías (el enunciado pide mínimo 6 en 3):

| ID | Evento | Categoría | Fecha | Cap. | Estado | Para qué está |
|---|---|---|---|---|---|---|
| EVT-0001 | Novena de aguinaldos en el parque | Cultura | 2026-12-16 18:30 | 120 | PUBLICADO | **con cupos disponibles** |
| EVT-0002 | Torneo de microfútbol de fin de año | Deportes | 2026-11-14 09:00 | 3 | PUBLICADO | **evento lleno** (3 confirmados de prueba) |
| EVT-0003 | Parche para armar el alumbrado de la cuadra | Comunidad | 2026-10-24 08:00 | 40 | PUBLICADO | **próximo a realizarse** (dispara recordatorios) |
| EVT-0004 | Cine navideño al aire libre | Cultura | 2026-11-28 19:00 | 60 | CANCELADO | **evento cancelado** |
| EVT-0005 | Taller de faroles para el Día de las Velitas | Educación | 2026-10-18 15:00 | 20 | CERRADO | **evento cerrado** |
| EVT-0006 | Noche de velitas en la cuadra | Comunidad | 2026-12-07 18:00 | 150 | PUBLICADO | con cupos |
| EVT-0007 | Taller de buñuelos y natilla con las abuelas | Educación | 2026-12-12 15:00 | 25 | PUBLICADO | con cupos |
| EVT-0008 | Bazar navideño de emprendedores | Emprendimiento | 2026-12-13 10:00 | 50 | PUBLICADO | con cupos |
| EVT-0009 | Concurso de pesebres | Cultura | 2026-12-20 16:00 | 40 | BORRADOR | no debe salir en el catálogo |

Si cuando se revise ya pasó la fecha del "próximo", se le cambia la fecha desde el formulario de WF04 (acción ACTUALIZAR) y listo.

## Usuarios de prueba

Contraseña de los tres: `Vecino2026*`

| Usuario | Correo | Rol |
|---|---|---|
| Marta Rodríguez | marta.vecina@example.com | **SUPERVISOR** (hace de representante del barrio para probar el Panel) |
| Don Julio Pérez | julio.tienda@example.com | VECINO |
| Camila Torres | camila.torres@example.com | VECINO |

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
