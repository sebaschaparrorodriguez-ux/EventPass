import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { enviarCodigoRegistro, registrarUsuario } from '../api'
import { useAuth } from '../auth'
import { ErrorBox, Exito } from '../components/Estado'

export default function Registro() {
  const { usuario } = useAuth()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' })
  const [paso, setPaso] = useState(1) // 1 datos, 2 codigo, 3 listo
  const [codigo, setCodigo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [espera, setEspera] = useState(0)

  // cuenta regresiva para poder reenviar el codigo
  useEffect(() => {
    if (espera <= 0) return
    const t = setTimeout(() => setEspera(espera - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  if (usuario) return <Navigate to="/" replace />

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const datos = () => ({
    nombre: form.nombre.trim(),
    email: form.email.trim(),
    password: form.password,
  })

  const pedirCodigo = async (e) => {
    e?.preventDefault()
    setError('')
    setAviso('')
    // validacion rapida en el front, la de verdad la hace n8n
    if (form.password.length < 8) return setError('La contraseña debe tener mínimo 8 caracteres.')
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden.')

    setCargando(true)
    try {
      await enviarCodigoRegistro(datos())
      setPaso(2)
      setEspera(60)
      setAviso(`Te enviamos un código a ${form.email.trim()}. Revisa también la carpeta de spam.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const crearCuenta = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(codigo)) return setError('El código tiene 6 números.')
    setCargando(true)
    try {
      await registrarUsuario({ ...datos(), codigo })
      setPaso(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  if (paso === 3)
    return (
      <div className="auth-page">
        <div className="caja">
          <h1>¡Bienvenido al barrio!</h1>
          <Exito mensaje="Tu correo quedó verificado y la cuenta creada. Te enviamos un correo de confirmación." />
          <Link to="/login" className="btn">
            Ir a ingresar
          </Link>
        </div>
      </div>
    )

  if (paso === 2)
    return (
      <div className="auth-page">
        <form className="form caja" onSubmit={crearCuenta}>
          <h1>Verifica tu correo</h1>
          <Exito mensaje={aviso} />
          <label>
            Código de 6 dígitos
            <input
              className="input-codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              required
            />
            <small>El código vence en 10 minutos.</small>
          </label>

          <ErrorBox mensaje={error} />

          <button className="btn" disabled={cargando}>
            {cargando ? 'Verificando...' : 'Verificar y crear cuenta'}
          </button>
          <div className="fila fila-entre">
            <button type="button" className="btn-link" onClick={() => { setPaso(1); setCodigo(''); setError('') }}>
              ← Cambiar mis datos
            </button>
            <button type="button" className="btn-link" onClick={pedirCodigo} disabled={espera > 0 || cargando}>
              {espera > 0 ? `Reenviar código (${espera}s)` : 'Reenviar código'}
            </button>
          </div>
        </form>
      </div>
    )

  return (
    <div className="auth-page">
      <form className="form caja" onSubmit={pedirCodigo}>
        <h1>Crear cuenta</h1>
        <p className="sub">Te vamos a mandar un código al correo para confirmar que es tuyo.</p>

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
          {cargando ? 'Enviando código...' : 'Enviar código a mi correo'}
        </button>
        <p className="mini">
          ¿Ya tienes cuenta? <Link to="/login">Ingresa</Link>
        </p>
      </form>
    </div>
  )
}
