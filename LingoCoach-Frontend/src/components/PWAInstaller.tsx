'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'

export default function PWAInstaller() {
  const [supportsPWA, setSupportsPWA] = useState(false)
  const [promptInstall, setPromptInstall] = useState<any>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      console.log('we are being triggered :D')
      setSupportsPWA(true)
      setPromptInstall(e)
    }

    window.addEventListener('beforeinstallprompt', handler as any)

    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [])

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault()
    if (!promptInstall) {
      return
    }
    promptInstall.prompt()
  }

  if (!supportsPWA) {
    return null
  }

  return (
    <button
      className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      onClick={onClick}
      aria-label="Install app"
    >
      <Download size={24} />
    </button>
  )
}