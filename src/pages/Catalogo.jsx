import { useEffect, useState } from 'react'
import { listarEventos } from '../api'
import EventoCard from '../components/EventoCard'
import { Cargando, ErrorBox } from '../components/Estado'
import { CATEGORIAS, getVisitorId } from '../utils'

export default function Catalogo() {
  const [eventos, setEventos] = useState([])
  const [categoria, setCategoria] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const r = await listarEventos(getVisitorId(), categoria)
      setEventos(r.eventos || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria])

  // primero los que siguen abiertos, los cancelados/cerrados al final
  const ordenados = [...eventos].sort((a, b) => {
    const pa = a.estado === 'PUBLICADO' ? 0 : 1
    const pb = b.estado === 'PUBLICADO' ? 0 : 1
    if (pa !== pb) return pa - pb
    return `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)
  })

  return (
    <>
      <section className="hero">
        <div className="alumbrado" aria-hidden="true" />
        <div className="hero-inner">
          <div>
            <p className="hero-kicker">Diciembre en el barrio</p>
            <h1>
              La Navidad se vive <span>en la cuadra.</span>
            </h1>
            <p className="hero-sub">
              Novenas en el parque, noche de velitas, el torneo de fin de año y el bazar de los
              emprendedores. Aparta tu cupo y te avisamos por correo y Telegram.
            </p>
          </div>
          <blockquote className="hero-frase">
            “Ven, ven, ven, a nuestras almas, Jesús, ven, ven, ven...”
            <small>Nos vemos en la novena, vecino.</small>
          </blockquote>
        </div>
        <div className="hero-velitas" aria-hidden="true" />
      </section>

      <section className="seccion">
        <div className="seccion-titulo">
          <h2>Planes de la temporada</h2>
          <span className="mini">Los cupos se actualizan en tiempo real</span>
        </div>
        <div className="filtros" role="tablist" aria-label="Filtrar por categoría">
          <button
            className={`chip ${categoria === '' ? 'activo' : ''}`}
            onClick={() => setCategoria('')}
          >
            Todos
          </button>
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              className={`chip ${categoria === c ? 'activo' : ''}`}
              onClick={() => setCategoria(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {cargando && <Cargando texto="Buscando eventos en el barrio..." />}
        {!cargando && error && <ErrorBox mensaje={error} onReintentar={cargar} />}
        {!cargando && !error && ordenados.length === 0 && (
          <div className="vacio">
            <h3>No hay eventos en esta categoría por ahora</h3>
            <p>Prueba con otra o vuelve en unos días.</p>
          </div>
        )}
        {!cargando && !error && ordenados.length > 0 && (
          <div className="grid">
            {ordenados.map((ev) => (
              <EventoCard key={ev.evento_id} evento={ev} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
