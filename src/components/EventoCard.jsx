import { Link } from 'react-router-dom'
import { fechaCorta, imagenDe, imagenRespaldo } from '../utils'
import Icono from './Icono'

export function EtiquetaCupo({ evento }) {
  if (evento.estado === 'CANCELADO') return <span className="tag tag-off">Cancelado</span>
  if (evento.estado === 'CERRADO') return <span className="tag tag-off">Inscripciones cerradas</span>
  if (evento.cupos_disponibles <= 0) return <span className="tag tag-espera">Lleno · lista de espera</span>
  if (evento.cupos_disponibles <= 5)
    return <span className="tag tag-pocos">¡Quedan {evento.cupos_disponibles}!</span>
  return <span className="tag tag-ok">{evento.cupos_disponibles} cupos</span>
}

export default function EventoCard({ evento }) {
  const { dia, mes } = fechaCorta(evento.fecha)
  const apagado = evento.estado === 'CANCELADO' || evento.estado === 'CERRADO'

  return (
    <Link to={`/evento/${evento.evento_id}`} className={`card ${apagado ? 'card-apagada' : ''}`}>
      <div className="card-img">
        <img
          src={imagenDe(evento)}
          alt=""
          loading="lazy"
          onError={(e) => (e.currentTarget.src = imagenRespaldo(evento.categoria))}
        />
        <div className="card-fecha">
          <strong>{dia}</strong>
          <span>{mes}</span>
        </div>
      </div>
      <div className="card-body">
        <span className={`cat cat-${evento.categoria?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}`}>
          {evento.categoria}
        </span>
        <h3>{evento.nombre}</h3>
        <p className="card-lugar">
          <Icono nombre="lugar" /> {evento.lugar} · {evento.hora}
        </p>
        <EtiquetaCupo evento={evento} />
      </div>
    </Link>
  )
}
