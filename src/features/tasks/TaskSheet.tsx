import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/Toast'
import { priorities } from '../../data/catalog'
import { useStore } from '../../store/StoreProvider'
import type { Priority, TaskItem } from '../../types'

const schema = z.object({
  title: z.string().min(2, 'Escribe la tarea').max(80),
  assignedMemberId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
})

type FormValues = z.infer<typeof schema>

export function TaskSheet({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing?: TaskItem | null
  onClose: () => void
}) {
  const { addTask, updateTask, members } = useStore()
  const toast = useToast()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      title: editing?.title ?? '',
      assignedMemberId: editing?.assignedMemberId ?? '',
      dueDate: editing?.dueDate ?? '',
      priority: (editing?.priority ?? 'medium') as Priority,
    },
  })

  return (
    <Sheet open={open} title={editing ? 'Editar tarea' : 'Nueva tarea'} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit((values) => {
          const payload = {
            title: values.title,
            assignedMemberId: values.assignedMemberId || null,
            dueDate: values.dueDate || null,
            priority: values.priority,
          }
          if (editing) updateTask(editing.id, payload)
          else addTask(payload)
          toast.push(editing ? 'Tarea actualizada' : 'Tarea creada')
          onClose()
        })}
      >
        <Field label="Tarea" error={form.formState.errors.title?.message}>
          <Input placeholder="Sacar la basura, pagar el agua..." {...form.register('title')} />
        </Field>
        <Field label="Asignar a">
          <Select {...form.register('assignedMemberId')}>
            <option value="">Sin asignar</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha límite">
          <Input type="date" {...form.register('dueDate')} />
        </Field>
        <Field label="Prioridad">
          <Select {...form.register('priority')}>
            {priorities.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" block>
          Guardar
        </Button>
      </form>
    </Sheet>
  )
}
