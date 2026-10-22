import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../api'
import { useAuth } from '../auth'
import { Cargando, ErrorBox, Exito } from '../components/Estado'
import { ESTADO_INSCRIPCION, formatearFecha } from '../utils'

export default function MisInscripciones() {
  const { token, sesionVencida } = useAuth()
  const navigate = useNavigate()
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [verCanceladas, setVerCanceladas] = useState(false)

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const r = await api.misInscripciones(token)
      setLista(r.inscripciones || [])
    } catch (e) {
      if (e.status === 401) {
        sesionVencida()
        return navigate('/login')
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

  const visibles = lista.filter((i) => verCanceladas || i.estado !== 'CANCELADA')

  return (
    <div className="seccion">
      <h1>Mis inscripciones</h1>
      <Exito mensaje={aviso} />

      {cargando && <Cargando texto="Trayendo tus inscripciones..." />}
      {!cargando && error && <ErrorBox mensaje={error} onReintentar={cargar} />}

      {!cargando && !error && (
        <>
          <label className="check">
            <input type="checkbox" checked={verCanceladas} onChange={(e) => setVerCanceladas(e.target.checked)} />
            Mostrar canceladas
          </label>

          {visibles.length === 0 ? (
            <div className="vacio">
              <h3>Todavía no tienes inscripciones</h3>
              <Link to="/" className="btn">
                Ver eventos
              </Link>
            </div>
          ) : (
            <div className="lista">
              {visibles.map((i) => (
                <Inscripcion
                  key={i.inscripcion_id}
                  item={i}
                  token={token}
                  onCambio={(msg) => {
                    setAviso(msg)
                    cargar()
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Inscripcion({ item, token, onCambio }) {
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({
    nombre_acreditacion: item.nombre_acreditacion || '',
    observaciones: item.observaciones || '',
  })
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const est = ESTADO_INSCRIPCION[item.estado] || { texto: item.estado, clase: '' }
  const activa = item.estado !== 'CANCELADA'

  const guardar = async (e) => {
    e.preventDefault()
    setOcupado(true)
    setError('')
    try {
      await api.editarInscripcion(token, item.inscripcion_id, form)
      setEditando(false)
      onCambio('Inscripción actualizada.')
    } catch (err) {
      setError(err.message)
    } finally {
      setOcupado(false)
    }
  }

  const cancelar = async () => {
    if (!confirm('¿Seguro que quieres cancelar esta inscripción? Tu cupo pasará a otra persona.')) return
    setOcupado(true)
    setError('')
    try {
      await api.cancelarInscripcion(token, item.inscripcion_id)
      onCambio('Inscripción cancelada. Te enviamos la confirmación.')
    } catch (err) {
      setError(err.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <article className={`inscripcion ${!activa ? 'apagada' : ''}`}>
      <div className="inscripcion-top">
        <div>
          <Link to={`/evento/${item.evento_id}`}>
            <h3>{item.evento?.nombre || item.evento_id}</h3>
          </Link>
          <p className="mini">
            {formatearFecha(item.evento?.fecha, item.evento?.hora)} · {item.evento?.lugar}
          </p>
        </div>
        <span className={`tag tag-${est.clase}`}>
          {est.texto}
          {item.estado === 'LISTA_ESPERA' && item.posicion_espera ? ` · puesto ${item.posicion_espera}` : ''}
        </span>
      </div>

      {item.evento?.estado === 'CANCELADO' && <p className="nota">Este evento fue cancelado por los organizadores.</p>}

      {!editando && (
        <p className="mini">
          Escarapela: <strong>{item.nombre_acreditacion || '—'}</strong>
          {item.observaciones && <> · Nota: {item.observaciones}</>}
        </p>
      )}

      {editando && (
        <form className="form" onSubmit={guardar}>
          <label>
            Nombre para la escarapela
            <input
              value={form.nombre_acreditacion}
              onChange={(e) => setForm({ ...form, nombre_acreditacion: e.target.value })}
              required
              maxLength={60}
            />
          </label>
          <label>
            Observaciones
            <textarea
              rows={2}
              maxLength={200}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </label>
          <div className="fila">
            <button type="button" className="btn btn-sec btn-sm" onClick={() => setEditando(false)}>
              Cancelar
            </button>
            <button className="btn btn-sm" disabled={ocupado}>
              Guardar
            </button>
          </div>
        </form>
      )}

      <ErrorBox mensaje={error} />

      {activa && !editando && (
        <div className="fila">
          <button className="btn btn-sec btn-sm" onClick={() => setEditando(true)} disabled={ocupado}>
            Editar datos
          </button>
          <button className="btn btn-peligro btn-sm" onClick={cancelar} disabled={ocupado}>
            {ocupado ? 'Procesando...' : 'Cancelar inscripción'}
          </button>
        </div>
      )}
    </article>
  )
}
