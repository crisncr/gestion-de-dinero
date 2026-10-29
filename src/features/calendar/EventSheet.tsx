import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { eventKinds } from '../../data/catalog'
import { todayISO } from '../../lib/format'
import { useStore } from '../../store/StoreProvider'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/Toast'
import type { CalendarEvent, EventKind } from '../../types'

const schema = z.object({
  title: z.string().min(2, 'Escribe un título').max(80),
  date: z.string().min(1),
  kind: z.enum(['payment', 'task', 'pet', 'shopping', 'other']),
  note: z.string().max(160).optional(),
})

type FormValues = z.infer<typeof schema>

export function EventSheet({
  open,
  initialDate,
  editing,
  onClose,
}: {
  open: boolean
  initialDate?: string
  editing?: CalendarEvent | null
  onClose: () => void
}) {
  const { addEvent, updateEvent } = useStore()
  const toast = useToast()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      title: editing?.title ?? '',
      date: editing?.date ?? initialDate ?? todayISO(),
      kind: (editing?.kind ?? 'other') as EventKind,
      note: editing?.note ?? '',
    },
  })

  return (
    <Sheet open={open} title={editing ? 'Editar acontecimiento' : 'Nuevo recordatorio'} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit((values) => {
          const payload = {
            title: values.title,
            date: values.date,
            kind: values.kind,
            note: values.note ?? '',
          }
          if (editing) updateEvent(editing.id, payload)
          else addEvent(payload)
          toast.push(editing ? 'Acontecimiento actualizado' : 'Recordatorio creado')
          onClose()
        })}
      >
        <Field label="Título" error={form.formState.errors.title?.message}>
          <Input placeholder="Pago de luz, supermercado..." {...form.register('title')} />
        </Field>
        <Field label="Fecha" error={form.formState.errors.date?.message}>
          <Input type="date" {...form.register('date')} />
        </Field>
        <Field label="Tipo">
          <Select {...form.register('kind')}>
            {eventKinds.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nota">
          <Textarea rows={3} placeholder="Opcional" {...form.register('note')} />
        </Field>
        <Button type="submit" block>
          Guardar
        </Button>
      </form>
    </Sheet>
  )
}
