// id anonimo para el log del catalogo y el chat cuando no hay sesion
export function getVisitorId() {
  const KEY = 'ep_visitor_id'
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = 'VIS-' + crypto.randomUUID().slice(0, 8).toUpperCase()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return 'VIS-ANONIMO'
  }
}

export function formatearFecha(fecha, hora) {
  if (!fecha) return ''
  const d = new Date(`${fecha}T${hora || '00:00'}:00`)
  if (isNaN(d)) return `${fecha} ${hora || ''}`
  const dia = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  return hora ? `${dia} · ${hora}` : dia
}

export function fechaCorta(fecha) {
  const d = new Date(`${fecha}T00:00:00`)
  if (isNaN(d)) return { dia: '--', mes: '' }
  return {
    dia: d.getDate(),
    mes: d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''),
  }
}

export const CATEGORIAS = ['Cultura', 'Deportes', 'Comunidad', 'Educación', 'Emprendimiento']

const IMG_CATEGORIA = {
  Cultura: '/img/cultura.svg',
  Deportes: '/img/deportes.svg',
  Comunidad: '/img/comunidad.svg',
  Educación: '/img/educacion.svg',
  Emprendimiento: '/img/emprendimiento.svg',
}

export const imagenDe = (evento) =>
  evento?.imagen_url || IMG_CATEGORIA[evento?.categoria] || '/img/comunidad.svg'

export const imagenRespaldo = (categoria) => IMG_CATEGORIA[categoria] || '/img/comunidad.svg'

export const ESTADO_INSCRIPCION = {
  CONFIRMADA: { texto: 'Confirmada', clase: 'ok' },
  LISTA_ESPERA: { texto: 'En lista de espera', clase: 'espera' },
  CANCELADA: { texto: 'Cancelada', clase: 'off' },
}
