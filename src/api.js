// Todas las llamadas pasan por n8n, el front nunca toca Google Sheets
const BASE = (import.meta.env.VITE_N8N_URL || '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(mensaje, status, codigo) {
    super(mensaje)
    this.status = status
    this.codigo = codigo
  }
}

async function llamar(ruta, { method = 'POST', body, query } = {}) {
  if (!BASE) throw new ApiError('Falta configurar VITE_N8N_URL en el .env', 0)

  let url = `${BASE}/webhook/${ruta}`
  if (query) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, v)
    })
    if ([...params].length) url += `?${params}`
  }

  let res
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // ngrok gratis muestra una pagina de aviso si no se manda esto
        'ngrok-skip-browser-warning': '1',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No pudimos conectar con el servidor. Intenta de nuevo en un momento.', 0)
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    // respuesta vacia o no JSON
  }

  if (!res.ok || !data || data.ok === false) {
    const msg = data?.mensaje || `Algo salió mal (error ${res.status})`
    throw new ApiError(msg, res.status, data?.error)
  }
  return data
}

// ---- WF01 usuarios
export const registrarUsuario = (datos) =>
  llamar('ep/usuarios', { body: { accion: 'crear', ...datos } })

export const verPerfil = (token) =>
  llamar('ep/usuarios', { body: { accion: 'perfil', token } })

export const actualizarPerfil = (token, cambios) =>
  llamar('ep/usuarios', { body: { accion: 'actualizar', token, ...cambios } })

export const desactivarCuenta = (token, password) =>
  llamar('ep/usuarios', { body: { accion: 'desactivar', token, password } })

// ---- WF02 sesiones
export const login = (email, password) =>
  llamar('ep/auth', { body: { accion: 'login', email, password } })

export const logout = (token) => llamar('ep/auth', { body: { accion: 'logout', token } })

export const validarSesion = (token) =>
  llamar('ep/auth', { body: { accion: 'validar', token } })

// ---- WF03 telegram
export const pedirCodigoTelegram = (token) =>
  llamar('ep/telegram', { body: { accion: 'solicitar', token } })

export const estadoTelegram = (token) =>
  llamar('ep/telegram', { body: { accion: 'estado', token } })

// ---- WF05 catalogo (publico)
export const listarEventos = (visitorId, categoria) =>
  llamar('ep/catalogo', {
    method: 'GET',
    query: { tipo: categoria ? 'FILTRO' : 'LISTADO', categoria, visitor_id: visitorId },
  })

export const detalleEvento = (visitorId, eventoId) =>
  llamar('ep/catalogo', {
    method: 'GET',
    query: { tipo: 'DETALLE', evento_id: eventoId, visitor_id: visitorId },
  })

// ---- WF06 inscripciones
export const inscribirme = (token, datos) =>
  llamar('ep/inscripciones', { body: { accion: 'crear', token, ...datos } })

export const misInscripciones = (token) =>
  llamar('ep/inscripciones', { body: { accion: 'mis', token } })

export const editarInscripcion = (token, inscripcionId, datos) =>
  llamar('ep/inscripciones', {
    body: { accion: 'actualizar', token, inscripcion_id: inscripcionId, ...datos },
  })

export const cancelarInscripcion = (token, inscripcionId) =>
  llamar('ep/inscripciones', {
    body: { accion: 'cancelar', token, inscripcion_id: inscripcionId },
  })
