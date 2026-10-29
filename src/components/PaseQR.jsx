import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { urlCheckin } from '../utils'

// pase de entrada: el vecino lo muestra en la puerta y el supervisor escanea el QR
export default function PaseQR({ inscripcion }) {
  const [img, setImg] = useState('')

  useEffect(() => {
    QRCode.toDataURL(urlCheckin(inscripcion.inscripcion_id, inscripcion.evento_id), {
      width: 220,
      margin: 1,
      color: { dark: '#14213d', light: '#ffffff' },
    })
      .then(setImg)
      .catch(() => setImg(''))
  }, [inscripcion.inscripcion_id, inscripcion.evento_id])

  return (
    <div className="pase">
      {img && <img src={img} alt="Código QR del pase" width="180" height="180" />}
      <div>
        <p className="mini">Muestra este pase en la entrada</p>
        <strong className="pase-codigo">{inscripcion.inscripcion_id}</strong>
        <p className="mini">
          {inscripcion.evento?.nombre} · {inscripcion.evento_id}
        </p>
        <p className="mini">A nombre de: {inscripcion.nombre_acreditacion}</p>
      </div>
    </div>
  )
}
