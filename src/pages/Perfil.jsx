import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import { useAuth } from '../auth'
import { Cargando, ErrorBox, Exito } from '../components/Estado'

const BOT = import.meta.env.VITE_TELEGRAM_BOT

export default function Perfil() {
  const { token, actualizarUsuario, sesionVencida, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const manejarError = (e, setter) => {
    if (e.status === 401) {
      sesionVencida()
      navigate('/login')
      return
    }
    setter(e.message)
  }

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const r = await api.verPerfil(token)
      setPerfil(r.usuario)
    } catch (e) {
      manejarError(e, setError)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (cargando) return <Cargando texto="Cargando tu perfil..." />
  if (error) return <div className="seccion"><ErrorBox mensaje={error} onReintentar={cargar} /></div>

  return (
    <div className="seccion perfil">
      <h1>Mi perfil</h1>
      <div className="perfil-grid">
        <DatosPerfil
          perfil={perfil}
          token={token}
          onGuardado={(u) => {
            setPerfil(u)
            actualizarUsuario({ ...u })
          }}
          manejarError={manejarError}
        />
        <Avisos
          perfil={perfil}
          token={token}
          onGuardado={(u) => setPerfil({ ...perfil, ...u })}
          manejarError={manejarError}
        />
        <Telegram token={token} manejarError={manejarError} />
        <Desactivar
          token={token}
          manejarError={manejarError}
          onListo={async () => {
            await cerrarSesion()
            navigate('/')
          }}
        />
      </div>
    </div>
  )
}

function DatosPerfil({ perfil, token, onGuardado, manejarError }) {
  const [nombre, setNombre] = useState(perfil.nombre)
  const [passActual, setPassActual] = useState('')
  const [passNueva, setPassNueva] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState('')
  const [error, setError] = useState('')

  const guardar = async (e) => {
    e.preventDefault()
    setOk('')
    setError('')
    if (passNueva && passNueva.length < 8) return setError('La nueva contraseña debe tener mínimo 8 caracteres.')
    if (passNueva && !passActual) return setError('Escribe tu contraseña actual para cambiarla.')

    setGuardando(true)
    try {
      const cambios = { nombre: nombre.trim() }
      if (passNueva) {
        cambios.password_actual = passActual
        cambios.password_nueva = passNueva
      }
      const r = await api.actualizarPerfil(token, cambios)
      onGuardado(r.usuario)
      setPassActual('')
      setPassNueva('')
      setOk('Cambios guardados.')
    } catch (err) {
      manejarError(err, setError)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="form caja" onSubmit={guardar}>
      <h2>Mis datos</h2>
      <p className="mini">
        Correo: <strong>{perfil.email}</strong> · Miembro desde {perfil.fecha_registro?.slice(0, 10)}
      </p>
      <label>
        Nombre
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={3} maxLength={60} />
      </label>
      <details>
        <summary>Cambiar contraseña</summary>
        <label>
          Contraseña actual
          <input type="password" value={passActual} onChange={(e) => setPassActual(e.target.value)} autoComplete="current-password" />
        </label>
        <label>
          Nueva contraseña
          <input type="password" value={passNueva} onChange={(e) => setPassNueva(e.target.value)} autoComplete="new-password" />
        </label>
      </details>
      <ErrorBox mensaje={error} />
      <Exito mensaje={ok} />
      <button className="btn" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}

function Avisos({ perfil, token, onGuardado, manejarError }) {
  const [correo, setCorreo] = useState(perfil.avisos_email !== false)
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState('')
  const [error, setError] = useState('')

  const guardar = async (e) => {
    e.preventDefault()
    setOk('')
    setError('')
    setGuardando(true)
    try {
      const r = await api.actualizarPerfil(token, { avisos_email: correo })
      onGuardado(r.usuario)
      setOk('Listo, te avisamos por ahí.')
    } catch (err) {
      manejarError(err, setError)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="form caja" onSubmit={guardar}>
      <h2>¿Por dónde te avisamos?</h2>
      <p className="mini">Confirmaciones, cambios de los eventos y recordatorios (un día antes y dos horas antes).</p>
      <div className="avisos">
        <label>
          <input type="checkbox" checked readOnly disabled />
          Telegram <span className="mini">(obligatorio, vincúlalo abajo)</span>
        </label>
        <label>
          <input type="checkbox" checked={correo} onChange={(e) => setCorreo(e.target.checked)} />
          También por correo electrónico <span className="mini">(opcional)</span>
        </label>
      </div>
      <p className="mini">
        ¿Prefieres WhatsApp? En cada evento y en tus inscripciones está el botón <strong>Recordármelo por WhatsApp</strong>.
      </p>
      <ErrorBox mensaje={error} />
      <Exito mensaje={ok} />
      <button className="btn" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </form>
  )
}

function Telegram({ token, manejarError }) {
  const [estado, setEstado] = useState(null)
  const [codigo, setCodigo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const revisar = async () => {
    setCargando(true)
    setError('')
    try {
      const r = await api.estadoTelegram(token)
      setEstado(r)
      if (r.vinculado) setCodigo(null)
    } catch (e) {
      manejarError(e, setError)
    } finally {
      setCargando(false)
    }
  }

  const pedirCodigo = async () => {
    setCargando(true)
    setError('')
    try {
      const r = await api.pedirCodigoTelegram(token)
      setCodigo(r)
    } catch (e) {
      manejarError(e, setError)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    revisar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="caja">
      <h2>Telegram</h2>
      <p className="mini">Lo necesitas para inscribirte: por aquí te llegan siempre las confirmaciones y recordatorios.</p>

      {cargando && <Cargando texto="Un momento..." />}
      <ErrorBox mensaje={error} />

      {!cargando && estado?.vinculado && (
        <Exito mensaje={`Cuenta vinculada${estado.telegram_username ? ` (@${estado.telegram_username})` : ''} ✔`} />
      )}

      {!cargando && estado && !estado.vinculado && !codigo && (
        <button className="btn" onClick={pedirCodigo}>
          Generar código de vinculación
        </button>
      )}

      {!cargando && codigo && (
        <div className="codigo-box">
          <p>Envíale este mensaje a nuestro bot:</p>
          <code className="codigo">/vincular {codigo.codigo}</code>
          <p className="mini">
            El código vence a las {new Date(codigo.expira_en).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} y solo sirve una vez.
          </p>
          {BOT && (
            <a className="btn btn-sec" href={`https://t.me/${BOT}`} target="_blank" rel="noreferrer">
              Abrir @{BOT}
            </a>
          )}
          <button className="btn" onClick={revisar}>
            Ya lo envié
          </button>
        </div>
      )}
    </div>
  )
}

function Desactivar({ token, manejarError, onListo }) {
  const [abierto, setAbierto] = useState(false)
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const confirmar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      await api.desactivarCuenta(token, password)
      onListo()
    } catch (err) {
      manejarError(err, setError)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="caja caja-peligro">
      <h2>Desactivar cuenta</h2>
      <p className="mini">Tu cuenta queda inactiva y se cierran tus sesiones. Tus datos no se borran.</p>
      {!abierto ? (
        <button className="btn btn-peligro" onClick={() => setAbierto(true)}>
          Quiero desactivarla
        </button>
      ) : (
        <form className="form" onSubmit={confirmar}>
          <label>
            Confirma con tu contraseña
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <ErrorBox mensaje={error} />
          <div className="fila">
            <button type="button" className="btn btn-sec" onClick={() => setAbierto(false)}>
              Mejor no
            </button>
            <button className="btn btn-peligro" disabled={enviando}>
              {enviando ? 'Desactivando...' : 'Desactivar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
