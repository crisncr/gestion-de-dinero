import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/Toast'
import { shoppingCategories } from '../../data/catalog'
import { useStore } from '../../store/StoreProvider'
import type { ShoppingItem } from '../../types'

const schema = z.object({
  name: z.string().min(2, 'Escribe el producto').max(80),
  category: z.string().min(1, 'Elige una categoría'),
  quantity: z.number().min(1, 'Mínimo 1'),
  price: z.number().min(0, 'Precio inválido'),
})

type FormValues = z.infer<typeof schema>

export function ItemSheet({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing?: ShoppingItem | null
  onClose: () => void
}) {
  const { addShopping, updateShopping } = useStore()
  const toast = useToast()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: editing?.name ?? '',
      category: editing?.category ?? 'mercado',
      quantity: editing?.quantity ?? 1,
      price: editing?.price ?? 0,
    },
  })

  return (
    <Sheet open={open} title={editing ? 'Editar producto' : 'Agregar producto'} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit((values) => {
          if (editing) updateShopping(editing.id, values)
          else addShopping(values)
          toast.push(editing ? 'Producto actualizado' : 'Producto agregado')
          onClose()
        })}
      >
        <Field label="Producto" error={form.formState.errors.name?.message}>
          <Input placeholder="Leche, pan, detergente..." {...form.register('name')} />
        </Field>
        <Field label="Categoría" error={form.formState.errors.category?.message}>
          <Select {...form.register('category')}>
            {shoppingCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad" error={form.formState.errors.quantity?.message}>
            <Input type="number" min="1" {...form.register('quantity', { valueAsNumber: true })} />
          </Field>
          <Field label="Precio" error={form.formState.errors.price?.message}>
            <Input type="number" min="0" {...form.register('price', { valueAsNumber: true })} />
          </Field>
        </div>
        <Button type="submit" block>
          Guardar
        </Button>
      </form>
    </Sheet>
  )
}
