import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { ErrorBox } from '../components/Estado'

export default function Login() {
  const { iniciarSesion, usuario } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  if (usuario) return <Navigate to="/" replace />

  const enviar = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      await iniciarSesion(email.trim(), password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="form caja" onSubmit={enviar}>
        <h1>Ingresar</h1>
        <p className="sub">Qué bueno verte otra vez por el barrio.</p>

        <label>
          Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <ErrorBox mensaje={error} />

        <button className="btn" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
        <p className="mini">
          ¿No tienes cuenta? <Link to="/registro">Créala aquí</Link>
        </p>
      </form>
    </div>
  )
}
