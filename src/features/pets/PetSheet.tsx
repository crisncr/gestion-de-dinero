import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/Toast'
import { petSpecies } from '../../data/catalog'
import { readImage } from '../../lib/crypto'
import { useStore } from '../../store/StoreProvider'
import type { Pet } from '../../types'

const schema = z.object({
  name: z.string().min(2, 'Escribe el nombre').max(40),
  species: z.string().min(1),
  weight: z.number().min(0, 'Peso inválido'),
  nextVaccine: z.string().optional(),
  notes: z.string().max(160).optional(),
})

type FormValues = z.infer<typeof schema>

export function PetSheet({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing?: Pet | null
  onClose: () => void
}) {
  const { addPet, updatePet } = useStore()
  const toast = useToast()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: editing?.name ?? '',
      species: editing?.species ?? 'Perro',
      weight: editing?.weight ?? 0,
      nextVaccine: editing?.nextVaccine ?? '',
      notes: editing?.notes ?? '',
    },
  })

  return (
    <Sheet open={open} title={editing ? 'Editar mascota' : 'Nueva mascota'} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit(async (values) => {
          const file = (document.getElementById('pet-photo') as HTMLInputElement | null)?.files?.[0]
          let photo = editing?.photo ?? null
          if (file) {
            try {
              photo = await readImage(file)
            } catch {
              toast.push('No se pudo leer la foto', 'error')
              return
            }
          }
          const payload = {
            name: values.name,
            species: values.species,
            weight: values.weight,
            photo,
            nextVaccine: values.nextVaccine || null,
            notes: values.notes ?? '',
          }
          if (editing) {
            updatePet(editing.id, payload)
            toast.push('Mascota actualizada')
          } else {
            addPet(payload)
            toast.push('Mascota agregada')
          }
          onClose()
        })}
      >
        <Field label="Foto">
          <Input id="pet-photo" type="file" accept="image/*" />
        </Field>
        <Field label="Nombre" error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} />
        </Field>
        <Field label="Especie">
          <Select {...form.register('species')}>
            {petSpecies.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Peso (kg)" error={form.formState.errors.weight?.message}>
          <Input type="number" step="0.1" min="0" {...form.register('weight', { valueAsNumber: true })} />
        </Field>
        <Field label="Próxima vacuna">
          <Input type="date" {...form.register('nextVaccine')} />
        </Field>
        <Field label="Notas">
          <Textarea rows={3} {...form.register('notes')} />
        </Field>
        <Button type="submit" block>
          Guardar
        </Button>
      </form>
    </Sheet>
  )
}
