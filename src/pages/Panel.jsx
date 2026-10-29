import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import * as api from '../api'
import { useAuth } from '../auth'
import { Cargando, ErrorBox, Exito } from '../components/Estado'
import { ESTADO_INSCRIPCION, formatearFecha, getVisitorId } from '../utils'

// ---------- check-in (WF11) ----------
const RESULTADO = {
  EXITOSO: { clase: 'ok', titulo: '✔ Ingreso registrado' },
  DUPLICADO: { clase: 'dup', titulo: '⚠ Ya había ingresado' },
  RECHAZADO: { clase: 'no', titulo: '✖ No puede ingresar' },
}

// acepta el codigo solo (INS-...) o el link completo del QR
function leerCodigo(texto) {
  const t = String(texto || '').trim()
  try {
    const u = new URL(t)
    return { inscripcion: u.searchParams.get('checkin') || '', evento: u.searchParams.get('evento') || '' }
  } catch {
    return { inscripcion: t.toUpperCase(), evento: '' }
  }
}

async function hacerCheckin(token, inscripcionId, eventoId) {
  try {
    const r = await api.registrarCheckin(token, inscripcionId, eventoId)
    return r
  } catch (e) {
    // duplicado y rechazado llegan como error HTTP pero traen el detalle en el body
    if (e.data?.resultado) return e.data
    return { resultado: 'RECHAZADO', mensaje: e.message }
  }
}

function TarjetaResultado({ r }) {
  if (!r) return null
  const cfg = RESULTADO[r.resultado] || RESULTADO.RECHAZADO
  return (
    <div className={`resultado-checkin resultado-${cfg.clase}`} role="status">
      <strong>{cfg.titulo}</strong>
      <p>{r.mensaje}</p>
      {r.asistente && (
        <p className="mini">
          {r.asistente.nombre} · escarapela: <strong>{r.asistente.nombre_acreditacion}</strong>
        </p>
      )}
      {r.evento && <p className="mini">{r.evento.nombre}</p>}
    </div>
  )
}

function Checkin({ inscripcionInicial, eventoInicial }) {
  const { token } = useAuth()
  const [eventos, setEventos] = useState([])
  const [eventoId, setEventoId] = useState(eventoInicial)
  const [codigo, setCodigo] = useState(inscripcionInicial)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    api
      .listarEventos(getVisitorId())
      .then((r) => {
        const lista = (r.eventos || []).filter((e) => e.estado === 'PUBLICADO')
        setEventos(lista)
        if (!eventoInicial && lista[0]) setEventoId(lista[0].evento_id)
      })
      .catch(() => setEventos([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const registrar = async (e) => {
    e.preventDefault()
    const leido = leerCodigo(codigo)
    const evento = leido.evento || eventoId
    if (!leido.inscripcion || !evento) return
    setEnviando(true)
    setResultado(null)
    const r = await hacerCheckin(token, leido.inscripcion, evento)
    setResultado(r)
    setEnviando(false)
    if (r.resultado === 'EXITOSO') setCodigo('')
  }

  return (
    <div className="checkin-grid">
      <form className="form caja" onSubmit={registrar}>
        <h2>Registrar ingreso</h2>
        <p className="mini">
          Escanea el QR del pase con la cámara del celular (abre esta pantalla con todo listo) o escribe el código de la
          inscripción.
        </p>
        <label>
          Evento
          <select value={eventoId} onChange={(e) => setEventoId(e.target.value)} required>
            {eventoInicial && !eventos.some((e) => e.evento_id === eventoInicial) && (
              <option value={eventoInicial}>{eventoInicial}</option>
            )}
            {eventos.map((e) => (
              <option key={e.evento_id} value={e.evento_id}>
                {e.nombre} ({e.fecha})
              </option>
            ))}
          </select>
        </label>
        <label>
          Código de inscripción
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="INS-XXXXXXXX o el link del QR"
            required
          />
        </label>
        <button className="btn" disabled={enviando}>
          {enviando ? 'Verificando...' : 'Registrar ingreso'}
        </button>
      </form>
      <div>
        {enviando && <Cargando texto="Verificando la inscripción..." />}
        <TarjetaResultado r={resultado} />
      </div>
    </div>
  )
}

const ROLES = [
  { valor: 'VECINO', texto: 'Vecino' },
  { valor: 'SUPERVISOR', texto: 'Supervisor' },
  { valor: 'ADMINISTRADOR', texto: 'Administrador' },
]

// selector de rol con su boton de guardar; lo usan las dos pestanas del panel
function SelectorRol({ usuarioId, rol, onCambio }) {
  const { token, usuario } = useAuth()
  const [valor, setValor] = useState(rol)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const yo = usuarioId === usuario.usuario_id

  useEffect(() => setValor(rol), [rol])

  const guardar = async () => {
    setGuardando(true)
    setError('')
    try {
      const r = await api.asignarRol(token, usuarioId, valor)
      onCambio(usuarioId, valor, r.mensaje)
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="selector-rol">
      <select
        value={valor}
        disabled={yo || guardando}
        title={yo ? 'No puedes cambiar tu propio rol' : 'Cambiar rol'}
        onChange={(e) => setValor(e.target.value)}
      >
        {ROLES.map((r) => (
          <option key={r.valor} value={r.valor}>
            {r.texto}
          </option>
        ))}
      </select>
      {!yo && valor !== rol && (
        <button className="btn btn-sm" onClick={guardar} disabled={guardando}>
          {guardando ? '...' : 'Guardar'}
        </button>
      )}
      {error && <span className="error-mini">{error}</span>}
    </div>
  )
}

export default function Panel() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMINISTRADOR'
  // si llegan desde el QR del pase (/panel?checkin=INS-..&evento=EVT-..) se abre directo el check-in
  const [params] = useSearchParams()
  const [pestana, setPestana] = useState(params.get('checkin') ? 'checkin' : 'inscritos')

  if (!['SUPERVISOR', 'ADMINISTRADOR'].includes(usuario?.rol)) return <Navigate to="/" replace />

  return (
    <div className="seccion">
      <div className="seccion-titulo">
        <h1>Panel del barrio</h1>
        <span className={`tag ${esAdmin ? 'tag-espera' : 'tag-ok'}`}>{usuario.rol}</span>
      </div>

      <div className="filtros">
        <button className={`chip ${pestana === 'checkin' ? 'activo' : ''}`} onClick={() => setPestana('checkin')}>
          Check-in
        </button>
        <button className={`chip ${pestana === 'inscritos' ? 'activo' : ''}`} onClick={() => setPestana('inscritos')}>
          Inscritos por evento
        </button>
        {esAdmin && (
          <button className={`chip ${pestana === 'usuarios' ? 'activo' : ''}`} onClick={() => setPestana('usuarios')}>
            Usuarios y roles
          </button>
        )}
        {esAdmin && (
          <a className="chip" href={api.urlFormularioEventos()} target="_blank" rel="noreferrer">
            Administrar eventos ↗
          </a>
        )}
      </div>

      {pestana === 'checkin' && (
        <Checkin inscripcionInicial={params.get('checkin') || ''} eventoInicial={params.get('evento') || ''} />
      )}
      {pestana === 'inscritos' && <Inscritos />}
      {pestana === 'usuarios' && esAdmin && <Usuarios />}
    </div>
  )
}

function usePeticion(fn) {
  const { token, sesionVencida } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      setData(await fn(token))
    } catch (e) {
      if (e.status === 401) {
        sesionVencida()
        navigate('/login')
        return
      }
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, setData, cargando, error, cargar, token }
}

function descargarCSV(evento) {
  const cols = ['Evento', 'Nombre', 'Correo', 'Escarapela', 'Estado', 'Puesto en espera', 'Fecha de inscripción', 'Observaciones']
  const limpiar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const filas = evento.inscritos.map((i) =>
    [evento.nombre, i.nombre, i.email, i.nombre_acreditacion, i.estado, i.puesto_espera ?? '', i.fecha_inscripcion, i.observaciones]
      .map(limpiar)
      .join(';'),
  )
  // ; y BOM para que Excel en español lo abra bien con tildes
  const csv = '﻿' + [cols.map(limpiar).join(';'), ...filas].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `inscritos-${evento.evento_id}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function Inscritos() {
  const { usuario } = useAuth()
  const esAdmin = usuario.rol === 'ADMINISTRADOR'
  const { data, setData, cargando, error, cargar } = usePeticion(api.inscritosPorEvento)
  const [elegido, setElegido] = useState(null)
  const [verCanceladas, setVerCanceladas] = useState(false)
  const [aviso, setAviso] = useState('')

  // al cambiar el rol de alguien se actualiza en todos los eventos donde aparece
  const rolCambiado = (usuarioId, rol, mensaje) => {
    setAviso(mensaje)
    setData((d) => ({
      ...d,
      eventos: d.eventos.map((e) => ({
        ...e,
        inscritos: e.inscritos.map((i) => (i.usuario_id === usuarioId ? { ...i, rol } : i)),
      })),
    }))
  }

  // check-in desde la lista: misma llamada al WF11 que la pestana de check-in
  const { token } = useAuth()
  const [resultadoFila, setResultadoFila] = useState(null)
  const [registrando, setRegistrando] = useState('')
  const checkinFila = async (ev, i) => {
    setRegistrando(i.inscripcion_id)
    const r = await hacerCheckin(token, i.inscripcion_id, ev.evento_id)
    setResultadoFila(r)
    setRegistrando('')
    if (r.resultado === 'EXITOSO' || r.resultado === 'DUPLICADO') {
      setData((d) => ({
        ...d,
        eventos: d.eventos.map((e) =>
          e.evento_id !== ev.evento_id
            ? e
            : {
                ...e,
                asistieron: (e.asistieron || 0) + (r.resultado === 'EXITOSO' ? 1 : 0),
                inscritos: e.inscritos.map((x) => (x.inscripcion_id === i.inscripcion_id ? { ...x, estado: 'ASISTIO' } : x)),
              },
        ),
      }))
    }
  }

  const eventos = data?.eventos || []
  const evento = useMemo(() => eventos.find((e) => e.evento_id === elegido) || eventos[0], [eventos, elegido])

  if (cargando) return <Cargando texto="Trayendo los inscritos..." />
  if (error) return <ErrorBox mensaje={error} onReintentar={cargar} />
  if (!eventos.length) return <div className="vacio">No hay eventos todavía.</div>

  const lista = evento.inscritos.filter((i) => verCanceladas || i.estado !== 'CANCELADA')

  return (
    <div className="panel-grid">
      <aside className="panel-eventos">
        {eventos.map((e) => (
          <button
            key={e.evento_id}
            className={`panel-evento ${evento.evento_id === e.evento_id ? 'activo' : ''}`}
            onClick={() => setElegido(e.evento_id)}
          >
            <strong>{e.nombre}</strong>
            <span className="mini">
              {e.fecha} · {e.estado}
            </span>
            <span className="mini">
              {e.confirmados}/{e.capacidad} confirmados{e.en_espera ? ` · ${e.en_espera} en espera` : ''}
            </span>
          </button>
        ))}
      </aside>

      <section className="caja panel-detalle">
        <div className="seccion-titulo">
          <div>
            <h2>{evento.nombre}</h2>
            <p className="mini capital">
              {formatearFecha(evento.fecha, evento.hora)} · {evento.lugar}
            </p>
          </div>
          <button className="btn btn-sec btn-sm" onClick={() => descargarCSV(evento)} disabled={!evento.inscritos.length}>
            Descargar CSV
          </button>
        </div>

        <div className="contadores">
          <div><strong>{evento.confirmados}</strong><span>con cupo</span></div>
          <div><strong>{evento.asistieron || 0}</strong><span>ya ingresaron</span></div>
          <div><strong>{Math.max(evento.capacidad - evento.confirmados, 0)}</strong><span>cupos libres</span></div>
          <div><strong>{evento.en_espera}</strong><span>en espera</span></div>
          <div><strong>{evento.canceladas}</strong><span>canceladas</span></div>
        </div>
        <TarjetaResultado r={resultadoFila} />

        <label className="check">
          <input type="checkbox" checked={verCanceladas} onChange={(e) => setVerCanceladas(e.target.checked)} />
          Mostrar canceladas
        </label>

        {esAdmin && <p className="mini">Como administrador puedes cambiar el rol de cada persona desde la columna <strong>Rol</strong>.</p>}
        <Exito mensaje={aviso} />

        {lista.length === 0 ? (
          <p className="mini">Nadie inscrito todavía.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Escarapela</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th>Inscrito</th>
                  <th>Observaciones</th>
                  <th>Ingreso</th>
                  {esAdmin && <th>Rol</th>}
                </tr>
              </thead>
              <tbody>
                {lista.map((i) => {
                  const est = ESTADO_INSCRIPCION[i.estado] || { texto: i.estado, clase: '' }
                  return (
                    <tr key={i.inscripcion_id}>
                      <td>{i.nombre}</td>
                      <td>{i.nombre_acreditacion}</td>
                      <td className="mini">{i.email}</td>
                      <td>
                        <span className={`tag tag-${est.clase}`}>
                          {est.texto}
                          {i.puesto_espera ? ` #${i.puesto_espera}` : ''}
                        </span>
                      </td>
                      <td className="mini">{String(i.fecha_inscripcion).slice(0, 16).replace('T', ' ')}</td>
                      <td className="mini">{i.observaciones}</td>
                      <td>
                        {i.estado === 'CONFIRMADA' && evento.estado === 'PUBLICADO' && (
                          <button
                            className="btn btn-sm"
                            onClick={() => checkinFila(evento, i)}
                            disabled={registrando === i.inscripcion_id}
                          >
                            {registrando === i.inscripcion_id ? '...' : 'Registrar ingreso'}
                          </button>
                        )}
                        {i.estado === 'ASISTIO' && <span className="mini">✔ Ingresó</span>}
                      </td>
                      {esAdmin && (
                        <td>
                          {i.usuario_id ? <SelectorRol usuarioId={i.usuario_id} rol={i.rol} onCambio={rolCambiado} /> : '—'}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Usuarios() {
  const { usuario } = useAuth()
  const { data, setData, cargando, error, cargar } = usePeticion(api.listarUsuarios)
  const [aviso, setAviso] = useState('')
  const [buscar, setBuscar] = useState('')

  if (cargando) return <Cargando texto="Cargando usuarios..." />
  if (error) return <ErrorBox mensaje={error} onReintentar={cargar} />

  const usuarios = (data?.usuarios || []).filter((u) =>
    `${u.nombre} ${u.email}`.toLowerCase().includes(buscar.toLowerCase()),
  )

  const rolCambiado = (usuarioId, rol, mensaje) => {
    setAviso(mensaje)
    setData((d) => ({ ...d, usuarios: d.usuarios.map((u) => (u.usuario_id === usuarioId ? { ...u, rol } : u)) }))
  }

  return (
    <section className="caja">
      <div className="seccion-titulo">
        <h2>Usuarios y roles</h2>
        <input className="buscador" placeholder="Buscar por nombre o correo" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
      </div>
      <p className="mini">
        <strong>Supervisor:</strong> ve los inscritos de cada evento. <strong>Administrador:</strong> además asigna roles y
        administra los eventos. Al cambiar el rol le llega un aviso a la persona.
      </p>
      <Exito mensaje={aviso} />
      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.usuario_id}>
                <td>
                  {u.nombre} {u.usuario_id === usuario.usuario_id && <span className="mini">(tú)</span>}
                </td>
                <td className="mini">{u.email}</td>
                <td className="mini">{u.estado}</td>
                <td>
                  <SelectorRol usuarioId={u.usuario_id} rol={u.rol} onCambio={rolCambiado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
