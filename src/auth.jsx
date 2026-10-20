import { createContext, useContext, useEffect, useState } from 'react'
import * as api from './api'

const AuthContext = createContext(null)
const KEY = 'ep_sesion'

function leerGuardada() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerGuardada)
  const [revisando, setRevisando] = useState(!!leerGuardada())

  const guardar = (s) => {
    setSesion(s)
    try {
      if (s) localStorage.setItem(KEY, JSON.stringify(s))
      else localStorage.removeItem(KEY)
    } catch {
      /* modo privado, no pasa nada */
    }
  }

  // al abrir la pagina revisamos que el token siga vivo en n8n
  useEffect(() => {
    const guardada = leerGuardada()
    if (!guardada?.token) return
    api
      .validarSesion(guardada.token)
      .then((r) => guardar({ ...guardada, usuario: r.usuario }))
      .catch((e) => {
        if (e.status === 401) guardar(null)
      })
      .finally(() => setRevisando(false))
  }, [])

  const iniciarSesion = async (email, password) => {
    const r = await api.login(email, password)
    guardar({ token: r.token, expira_en: r.expira_en, usuario: r.usuario })
    return r
  }

  const cerrarSesion = async () => {
    const token = sesion?.token
    guardar(null)
    if (token) {
      try {
        await api.logout(token)
      } catch {
        /* si falla igual queda cerrada en el navegador */
      }
    }
  }

  const actualizarUsuario = (usuario) => guardar({ ...sesion, usuario })

  // si n8n responde 401 en cualquier lado, se cierra la sesion local
  const sesionVencida = () => guardar(null)

  return (
    <AuthContext.Provider
      value={{
        sesion,
        token: sesion?.token,
        usuario: sesion?.usuario,
        revisando,
        iniciarSesion,
        cerrarSesion,
        actualizarUsuario,
        sesionVencida,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
