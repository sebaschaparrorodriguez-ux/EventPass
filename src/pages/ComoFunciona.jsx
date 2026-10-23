import { Link } from 'react-router-dom'

const pasos = [
  {
    titulo: 'Crea tu cuenta',
    texto: 'Solo nombre, correo y contraseña. Tu contraseña se guarda cifrada (hash + salt), nunca en texto plano.',
  },
  {
    titulo: 'Vincula Telegram',
    texto: 'En tu perfil generas un código y se lo mandas al bot con /vincular CODIGO. Es obligatorio para inscribirte.',
  },
  {
    titulo: 'Inscríbete',
    texto: 'Si hay cupo quedas CONFIRMADO. Si está lleno entras a la LISTA DE ESPERA en orden de llegada.',
  },
  {
    titulo: 'Te avisamos',
    texto: 'Confirmaciones, cambios y recordatorios te llegan siempre por Telegram y, si lo dejas activado, también por correo. Y si quieres, te lo guardas por WhatsApp.',
  },
]

export default function ComoFunciona() {
  return (
    <div className="seccion como">
      <h1>¿Cómo funciona?</h1>
      <p className="sub">EventPass Barrio junta en un solo lugar los planes que arma la comunidad.</p>

      <ol className="pasos">
        {pasos.map((p, i) => (
          <li key={p.titulo}>
            <span className="num">{i + 1}</span>
            <div>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="caja">
        <h2>Lista de espera</h2>
        <p>
          Cuando alguien cancela, el sistema revisa cada pocos minutos los eventos con espera y le da el
          cupo a quien lleva más tiempo esperando. Si te toca, te llega un mensaje y tu inscripción pasa
          a <strong>Confirmada</strong> sola.
        </p>
        <h2>¿Dudas?</h2>
        <p>
          Abajo a la derecha está el asistente del barrio. Te responde sobre eventos, fechas y lugares,
          pero no puede inscribirte ni cancelar por ti: eso lo haces desde la página.
        </p>
        <Link to="/" className="btn">
          Ver eventos
        </Link>
      </div>
    </div>
  )
}
