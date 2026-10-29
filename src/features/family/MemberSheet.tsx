import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/Toast'
import { roles } from '../../data/catalog'
import { useStore } from '../../store/StoreProvider'
import type { Member, Role } from '../../types'

const schema = z.object({
  name: z.string().min(2, 'Escribe el nombre').max(40),
  email: z.string().email('Correo inválido').or(z.literal('')),
  role: z.enum(['admin', 'member']),
})

type FormValues = z.infer<typeof schema>

export function MemberSheet({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing?: Member | null
  onClose: () => void
}) {
  const { addLocalMember, updateMember } = useStore()
  const toast = useToast()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: editing?.name ?? '',
      email: editing?.email ?? '',
      role: editing && editing.role !== 'owner' ? editing.role : 'member',
    },
  })

  return (
    <Sheet open={open} title={editing ? 'Editar integrante' : 'Agregar integrante'} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit((values) => {
          if (editing) {
            updateMember(editing.id, { name: values.name, role: values.role as Exclude<Role, 'owner'> })
            toast.push('Integrante actualizado')
          } else {
            addLocalMember(values.name, values.email, values.role)
            toast.push('Integrante agregado')
          }
          onClose()
        })}
      >
        <Field label="Nombre" error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} />
        </Field>
        {editing ? null : (
          <Field label="Correo" error={form.formState.errors.email?.message}>
            <Input type="email" placeholder="Opcional" {...form.register('email')} />
          </Field>
        )}
        <Field label="Rol">
          <Select {...form.register('role')}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
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
