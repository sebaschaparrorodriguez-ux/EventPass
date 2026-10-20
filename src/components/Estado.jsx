// componentes chiquitos para los estados de carga / error / exito

export function Cargando({ texto = 'Cargando...' }) {
  return (
    <div className="estado estado-cargando" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{texto}</p>
    </div>
  )
}

export function ErrorBox({ mensaje, onReintentar }) {
  if (!mensaje) return null
  return (
    <div className="estado estado-error" role="alert">
      <p>{mensaje}</p>
      {onReintentar && (
        <button className="btn btn-sec btn-sm" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export function Exito({ mensaje }) {
  if (!mensaje) return null
  return (
    <div className="estado estado-exito" role="status">
      <p>{mensaje}</p>
    </div>
  )
}
