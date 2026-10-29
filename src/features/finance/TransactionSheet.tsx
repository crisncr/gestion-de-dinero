import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { expenseCategories, incomeCategories } from '../../data/catalog'
import { todayISO } from '../../lib/format'
import { useStore } from '../../store/StoreProvider'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/Toast'
import type { Transaction, TxType } from '../../types'

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Ingresa un monto válido'),
  category: z.string().min(1, 'Elige una categoría'),
  description: z.string().max(120).optional(),
  date: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

export function TransactionSheet({
  open,
  initialType = 'expense',
  editing,
  onClose,
}: {
  open: boolean
  initialType?: TxType
  editing?: Transaction | null
  onClose: () => void
}) {
  const { addTransaction, updateTransaction } = useStore()
  const toast = useToast()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      type: editing?.type ?? initialType,
      amount: editing?.amount ?? 0,
      category: editing?.category ?? '',
      description: editing?.description ?? '',
      date: editing?.date ?? todayISO(),
    },
  })

  const type = form.watch('type')
  const cats = type === 'income' ? incomeCategories : expenseCategories

  return (
    <Sheet open={open} title={editing ? 'Editar movimiento' : type === 'income' ? 'Nuevo ingreso' : 'Nuevo gasto'} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit((values) => {
          const payload = {
            type: values.type,
            amount: values.amount,
            category: values.category,
            description: values.description ?? '',
            date: values.date,
          }
          if (editing) updateTransaction(editing.id, payload)
          else addTransaction(payload)
          toast.push(editing ? 'Movimiento actualizado' : 'Movimiento registrado')
          onClose()
        })}
      >
        <div className="grid grid-cols-2 gap-2">
          {(['expense', 'income'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                form.setValue('type', value)
                form.setValue('category', '')
              }}
              className={
                type === value
                  ? 'h-10 rounded-2xl bg-mint/10 text-sm font-semibold text-mint'
                  : 'h-10 rounded-2xl bg-lift text-sm text-mute'
              }
            >
              {value === 'expense' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>
        <Field label="Monto" error={form.formState.errors.amount?.message}>
          <Input type="number" inputMode="decimal" min="1" {...form.register('amount', { valueAsNumber: true })} />
        </Field>
        <Field label="Categoría" error={form.formState.errors.category?.message}>
          <Select {...form.register('category')}>
            <option value="">Selecciona</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Descripción">
          <Input maxLength={120} placeholder="Opcional" {...form.register('description')} />
        </Field>
        <Field label="Fecha" error={form.formState.errors.date?.message}>
          <Input type="date" {...form.register('date')} />
        </Field>
        <Button type="submit" block disabled={form.formState.isSubmitting}>
          Guardar
        </Button>
      </form>
    </Sheet>
  )
}
