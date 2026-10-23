import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import * as api from '../api'
import { useAuth } from '../auth'
import { Cargando, ErrorBox, Exito } from '../components/Estado'
import { ESTADO_INSCRIPCION, formatearFecha } from '../utils'

const ROLES = ['VECINO', 'SUPERVISOR', 'ADMINISTRADOR']

export default function Panel() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMINISTRADOR'
  const [pestana, setPestana] = useState('inscritos')

  if (!['SUPERVISOR', 'ADMINISTRADOR'].includes(usuario?.rol)) return <Navigate to="/" replace />

  return (
    <div className="seccion">
      <div className="seccion-titulo">
        <h1>Panel del barrio</h1>
        <span className={`tag ${esAdmin ? 'tag-espera' : 'tag-ok'}`}>{usuario.rol}</span>
      </div>

      <div className="filtros">
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

  return { data, cargando, error, cargar, token }
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
  const { data, cargando, error, cargar } = usePeticion(api.inscritosPorEvento)
  const [elegido, setElegido] = useState(null)
  const [verCanceladas, setVerCanceladas] = useState(false)

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
          <div><strong>{evento.confirmados}</strong><span>confirmados</span></div>
          <div><strong>{Math.max(evento.capacidad - evento.confirmados, 0)}</strong><span>cupos libres</span></div>
          <div><strong>{evento.en_espera}</strong><span>en espera</span></div>
          <div><strong>{evento.canceladas}</strong><span>canceladas</span></div>
        </div>

        <label className="check">
          <input type="checkbox" checked={verCanceladas} onChange={(e) => setVerCanceladas(e.target.checked)} />
          Mostrar canceladas
        </label>

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
  const { data, cargando, error, cargar, token } = usePeticion(api.listarUsuarios)
  const [cambios, setCambios] = useState({})
  const [guardando, setGuardando] = useState('')
  const [aviso, setAviso] = useState('')
  const [errorRol, setErrorRol] = useState('')
  const [buscar, setBuscar] = useState('')

  if (cargando) return <Cargando texto="Cargando usuarios..." />
  if (error) return <ErrorBox mensaje={error} onReintentar={cargar} />

  const usuarios = (data?.usuarios || []).filter((u) =>
    `${u.nombre} ${u.email}`.toLowerCase().includes(buscar.toLowerCase()),
  )

  const guardar = async (u) => {
    setAviso('')
    setErrorRol('')
    setGuardando(u.usuario_id)
    try {
      const r = await api.asignarRol(token, u.usuario_id, cambios[u.usuario_id])
      setAviso(r.mensaje)
      setCambios((c) => ({ ...c, [u.usuario_id]: undefined }))
      cargar()
    } catch (e) {
      setErrorRol(e.message)
    } finally {
      setGuardando('')
    }
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
      <ErrorBox mensaje={errorRol} />
      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Rol</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const yo = u.usuario_id === usuario.usuario_id
              const valor = cambios[u.usuario_id] ?? u.rol
              return (
                <tr key={u.usuario_id}>
                  <td>
                    {u.nombre} {yo && <span className="mini">(tú)</span>}
                  </td>
                  <td className="mini">{u.email}</td>
                  <td className="mini">{u.estado}</td>
                  <td>
                    <select
                      value={valor}
                      disabled={yo}
                      onChange={(e) => setCambios((c) => ({ ...c, [u.usuario_id]: e.target.value }))}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {!yo && valor !== u.rol && (
                      <button className="btn btn-sm" onClick={() => guardar(u)} disabled={guardando === u.usuario_id}>
                        {guardando === u.usuario_id ? 'Guardando...' : 'Guardar'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
