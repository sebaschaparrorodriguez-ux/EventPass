import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const navigate = useNavigate()

  const salir = async () => {
    setAbierto(false)
    await cerrarSesion()
    navigate('/')
  }

  const cerrar = () => setAbierto(false)

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo" onClick={cerrar}>
          <img src="/favicon.svg" alt="" width="34" height="34" />
          <span>
            EventPass <em>Barrio</em>
          </span>
        </Link>

        <button
          className="menu-btn"
          aria-label="Abrir menú"
          aria-expanded={abierto}
          onClick={() => setAbierto(!abierto)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${abierto ? 'abierto' : ''}`}>
          <NavLink to="/" end onClick={cerrar}>
            Eventos
          </NavLink>
          <NavLink to="/como-funciona" onClick={cerrar}>
            Cómo funciona
          </NavLink>
          {usuario ? (
            <>
              <NavLink to="/mis-inscripciones" onClick={cerrar}>
                Mis inscripciones
              </NavLink>
              {['SUPERVISOR', 'ADMINISTRADOR'].includes(usuario.rol) && (
                <NavLink to="/panel" onClick={cerrar}>
                  Panel
                </NavLink>
              )}
              <NavLink to="/perfil" onClick={cerrar}>
                Hola, {usuario.nombre?.split(' ')[0]}
              </NavLink>
              <button className="btn btn-sec btn-sm" onClick={salir}>
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={cerrar}>
                Ingresar
              </NavLink>
              <Link to="/registro" className="btn btn-sm" onClick={cerrar}>
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
