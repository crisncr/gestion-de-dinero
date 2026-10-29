import { useEffect, useState } from 'react'

export function PhoneAccess() {
  const url = import.meta.env.VITE_LAN_URL as string | undefined
  const [desktop, setDesktop] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const sync = () => setDesktop(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  if (!import.meta.env.DEV || !url || !desktop) return null

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=080808&color=f5f5f5&qzone=1&data=${encodeURIComponent(url)}`

  return (
    <div className="mt-8 rounded-[24px] border border-line bg-surface p-4 text-center">
      <p className="text-sm font-semibold">Ábrela en el teléfono</p>
      <p className="mt-1 text-xs leading-5 text-mute">
        Conecta el móvil a la misma Wi‑Fi y escanea el código, o pega este enlace en Safari o Chrome.
      </p>
      <img src={qr} alt="Código QR para abrir Casa360 en el móvil" className="mx-auto mt-4 size-40 rounded-2xl" />
      <p className="mt-3 break-all font-mono text-xs text-mint">{url}</p>
    </div>
  )
}
