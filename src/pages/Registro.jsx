import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { registrarUsuario } from '../api'
import { useAuth } from '../auth'
import { ErrorBox, Exito } from '../components/Estado'

export default function Registro() {
  const { usuario } = useAuth()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)

  if (usuario) return <Navigate to="/" replace />

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    // validacion rapida en el front, la de verdad la hace n8n
    if (form.password.length < 8) return setError('La contraseña debe tener mínimo 8 caracteres.')
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden.')

    setCargando(true)
    try {
      await registrarUsuario({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      setListo(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  if (listo)
    return (
      <div className="auth-page">
        <div className="caja">
          <Exito mensaje="¡Cuenta creada! Ya puedes ingresar." />
          <Link to="/login" className="btn">
            Ir a ingresar
          </Link>
        </div>
      </div>
    )

  return (
    <div className="auth-page">
      <form className="form caja" onSubmit={enviar}>
        <h1>Crear cuenta</h1>
        <p className="sub">Es gratis y te toma un minuto.</p>

        <label>
          Nombre completo
          <input value={form.nombre} onChange={cambiar('nombre')} required minLength={3} maxLength={60} autoComplete="name" />
        </label>
        <label>
          Correo
          <input type="email" value={form.email} onChange={cambiar('email')} required autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={form.password}
            onChange={cambiar('password')}
            required
            autoComplete="new-password"
          />
          <small>Mínimo 8 caracteres.</small>
        </label>
        <label>
          Repite la contraseña
          <input
            type="password"
            value={form.confirmar}
            onChange={cambiar('confirmar')}
            required
            autoComplete="new-password"
          />
        </label>

        <ErrorBox mensaje={error} />

        <button className="btn" disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
        <p className="mini">
          ¿Ya tienes cuenta? <Link to="/login">Ingresa</Link>
        </p>
      </form>
    </div>
  )
}
