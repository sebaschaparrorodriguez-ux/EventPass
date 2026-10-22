import { useEffect } from 'react'
import { useAuth } from '../auth'
import { getVisitorId } from '../utils'

const CHAT_URL = import.meta.env.VITE_N8N_CHAT_URL

// Widget del asistente (WF10). Es solo informativo, no hace inscripciones ni nada.
// La libreria pesa bastante, por eso se carga aparte cuando ya abrio la pagina.
export default function Asistente() {
  const { token } = useAuth()

  useEffect(() => {
    if (!CHAT_URL) return
    let app = null
    let cancelado = false

    Promise.all([import('@n8n/chat'), import('@n8n/chat/style.css')]).then(([{ createChat }]) => {
      if (cancelado) return
      app = createChat({
        webhookUrl: CHAT_URL,
        webhookConfig: {
          method: 'POST',
          headers: { 'ngrok-skip-browser-warning': '1' },
        },
        target: '#ep-chat',
        mode: 'window',
        // si hay sesion mandamos el token para que n8n sepa quien es (lo valida alla)
        metadata: { visitor_id: getVisitorId(), token: token || '' },
        showWelcomeScreen: false,
        loadPreviousSession: false,
        defaultLanguage: 'en',
        initialMessages: [
          '¡Quiubo, vecino! Soy el asistente de EventPass Barrio.',
          'Pregúntame por las novenas, fechas, lugares, la lista de espera o cómo vincular Telegram.',
        ],
        i18n: {
          en: {
            title: 'Asistente del Barrio',
            subtitle: 'Te ayudo con eventos e inscripciones',
            footer: '',
            getStarted: 'Nueva conversación',
            inputPlaceholder: 'Escribe tu pregunta...',
            closeButtonTooltip: 'Cerrar',
          },
        },
      })
    })

    return () => {
      cancelado = true
      app?.unmount()
      document.getElementById('ep-chat')?.replaceChildren()
    }
  }, [token])

  return <div id="ep-chat" />
}
