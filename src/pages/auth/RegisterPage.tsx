import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toast'
import { useStore } from '../../store/StoreProvider'

const schema = z.object({
  name: z.string().min(2, 'Escribe tu nombre').max(40),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  householdName: z.string().min(2, 'Escribe el nombre del hogar').max(40),
  monthlyBudget: z.number().min(0, 'Presupuesto inválido'),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const { register: createAccount } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      householdName: '',
      monthlyBudget: 0,
    },
  })

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold tracking-tight">Crear tu hogar</h1>
      <p className="mt-2 mb-7 text-center text-sm text-mute">
        Una cuenta por persona. El primer usuario queda como titular.
      </p>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await createAccount(values)
            navigate('/', { replace: true })
          } catch (error) {
            toast.push(error instanceof Error ? error.message : 'No se pudo crear la cuenta', 'error')
          }
        })}
      >
        <Field label="Tu nombre" error={form.formState.errors.name?.message}>
          <Input autoComplete="name" {...form.register('name')} />
        </Field>
        <Field label="Correo" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Field label="Contraseña" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        <Field label="Nombre del hogar" error={form.formState.errors.householdName?.message}>
          <Input placeholder="Casa Norte" {...form.register('householdName')} />
        </Field>
        <Field label="Presupuesto mensual" error={form.formState.errors.monthlyBudget?.message}>
          <Input type="number" min="0" {...form.register('monthlyBudget', { valueAsNumber: true })} />
        </Field>
        <Button type="submit" block disabled={form.formState.isSubmitting}>
          Crear cuenta
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-mute">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-mint">
          Entrar
        </Link>
      </p>
    </div>
  )
}
