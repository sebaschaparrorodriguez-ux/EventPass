import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { detalleEvento, inscribirme } from '../api'
import { useAuth } from '../auth'
import { EtiquetaCupo } from '../components/EventoCard'
import Icono from '../components/Icono'
import BotonWhatsApp from '../components/BotonWhatsApp'
import { Cargando, ErrorBox, Exito } from '../components/Estado'
import { formatearFecha, getVisitorId, imagenDe, imagenRespaldo } from '../utils'

export default function Evento() {
  const { id } = useParams()
  const { token, usuario, sesionVencida } = useAuth()

  const [evento, setEvento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ nombre_acreditacion: '', observaciones: '' })
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [errorInscripcion, setErrorInscripcion] = useState(null)

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const r = await detalleEvento(getVisitorId(), id)
      setEvento(r.evento)
    } catch (e) {
      setError(e.status === 404 ? 'No encontramos este evento.' : e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (usuario) setForm((f) => ({ ...f, nombre_acreditacion: f.nombre_acreditacion || usuario.nombre }))
  }, [usuario])

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setErrorInscripcion(null)
    setResultado(null)
    try {
      const r = await inscribirme(token, { evento_id: id, ...form })
      setResultado(r)
      cargar() // refresca los cupos
    } catch (err) {
      if (err.status === 401) sesionVencida()
      setErrorInscripcion(err)
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <Cargando texto="Cargando el evento..." />
  if (error)
    return (
      <div className="seccion">
        <ErrorBox mensaje={error} onReintentar={cargar} />
        <Link to="/">← Volver a los eventos</Link>
      </div>
    )
  if (!evento) return null

  const abierto = evento.inscripcion_abierta

  return (
    <div className="seccion detalle">
      <Link to="/" className="volver">
        ← Todos los eventos
      </Link>

      <div className="detalle-grid">
        <div className="detalle-img">
          <img
            src={imagenDe(evento)}
            alt={evento.nombre}
            onError={(e) => (e.currentTarget.src = imagenRespaldo(evento.categoria))}
          />
        </div>

        <div className="detalle-info">
          <span className="cat">{evento.categoria}</span>
          <h1>{evento.nombre}</h1>
          <EtiquetaCupo evento={evento} />

          <ul className="datos">
            <li>
              <Icono nombre="calendario" /> <span className="capital">{formatearFecha(evento.fecha, evento.hora)}</span>
            </li>
            <li>
              <Icono nombre="lugar" /> {evento.lugar}
            </li>
            <li>
              <Icono nombre="persona" /> Organiza: {evento.organizador}
            </li>
            <li>
              <Icono nombre="grupo" /> {evento.confirmados} de {evento.capacidad} cupos ocupados
              {evento.en_espera > 0 && ` · ${evento.en_espera} en espera`}
            </li>
          </ul>

          <p className="descripcion">{evento.descripcion}</p>
          {abierto && <BotonWhatsApp evento={evento} />}
        </div>
      </div>

      <div className="caja-inscripcion">
        {!abierto && (
          <p className="nota">
            {evento.estado === 'CANCELADO'
              ? 'Este evento fue cancelado por los organizadores.'
              : 'Las inscripciones para este evento ya están cerradas.'}
          </p>
        )}

        {abierto && !usuario && (
          <div>
            <h3>¿Quieres ir?</h3>
            <p>
              <Link to="/login">Ingresa</Link> o <Link to="/registro">crea tu cuenta</Link> para
              inscribirte.
            </p>
          </div>
        )}

        {abierto && usuario && !resultado && (
          <form onSubmit={enviar} className="form">
            <h3>{evento.cupos_disponibles > 0 ? 'Aparta tu cupo' : 'Únete a la lista de espera'}</h3>
            {evento.cupos_disponibles <= 0 && (
              <p className="nota">
                El evento está lleno. Si alguien cancela, te pasamos automáticamente en orden de
                llegada y te avisamos.
              </p>
            )}
            <label>
              Nombre para la escarapela
              <input
                value={form.nombre_acreditacion}
                onChange={(e) => setForm({ ...form, nombre_acreditacion: e.target.value })}
                maxLength={60}
                required
              />
            </label>
            <label>
              Observaciones (opcional)
              <textarea
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                maxLength={200}
                rows={2}
                placeholder="Ej: llevo buñuelos para compartir, voy con los niños, necesito acceso en silla de ruedas..."
              />
            </label>

            {errorInscripcion && (
              <div className="estado estado-error" role="alert">
                <p>{errorInscripcion.message}</p>
                {errorInscripcion.codigo === 'TELEGRAM_NO_VINCULADO' && (
                  <Link to="/perfil" className="btn btn-sm">
                    Vincular Telegram
                  </Link>
                )}
              </div>
            )}

            <button className="btn" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Inscribirme'}
            </button>
          </form>
        )}

        {resultado && (
          <div>
            <Exito
              mensaje={
                resultado.inscripcion?.estado === 'CONFIRMADA'
                  ? '¡Listo! Tu cupo está confirmado. Te enviamos la confirmación por Telegram (y por correo si lo tienes activado).'
                  : `Quedaste en lista de espera (puesto ${resultado.inscripcion?.orden_espera}). Si se libera un cupo te avisamos.`
              }
            />
            <Link to="/mis-inscripciones" className="btn btn-sec">
              Ver mis inscripciones
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
