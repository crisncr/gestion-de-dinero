import { Button } from './Button'
import { Sheet } from './Sheet'

export function Confirm({
  open,
  title,
  text,
  confirmLabel = 'Confirmar',
  danger,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  text: string
  confirmLabel?: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Sheet open={open} title={title} onClose={onClose}>
      <p className="mb-5 text-sm leading-6 text-mute">{text}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  )
}
