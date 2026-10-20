import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Asistente from './components/Asistente'
import { useAuth } from './auth'
import Catalogo from './pages/Catalogo'
import Evento from './pages/Evento'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Perfil from './pages/Perfil'
import MisInscripciones from './pages/MisInscripciones'
import ComoFunciona from './pages/ComoFunciona'
import { Cargando } from './components/Estado'

function Privada({ children }) {
  const { token, revisando } = useAuth()
  if (revisando) return <Cargando texto="Revisando tu sesión..." />
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="contenido">
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/evento/:id" element={<Evento />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/perfil"
            element={
              <Privada>
                <Perfil />
              </Privada>
            }
          />
          <Route
            path="/mis-inscripciones"
            element={
              <Privada>
                <MisInscripciones />
              </Privada>
            }
          />
          <Route
            path="*"
            element={
              <div className="vacio">
                <h2>Esta página no existe</h2>
                <a href="/">Volver al inicio</a>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
      <Asistente />
    </>
  )
}
