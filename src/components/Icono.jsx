// iconos sencillos en linea (para no depender de una libreria)
const trazos = {
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  lugar: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  persona: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  grupo: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <circle cx="17" cy="9.5" r="2.5" />
      <path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5M15.5 14.6c2.5-.3 4.8 1.2 6 4.4" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 3l9.5 17h-19z" />
      <path d="M12 10v4M12 17.5v.5" />
    </>
  ),
}

export default function Icono({ nombre }) {
  return (
    <svg
      className="icono"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {trazos[nombre]}
    </svg>
  )
}
