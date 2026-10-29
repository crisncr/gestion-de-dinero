import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toast'
import { useStore } from '../../store/StoreProvider'

const schema = z
  .object({
    email: z.string().email('Correo inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string().min(8),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden',
  })

type FormValues = z.infer<typeof schema>

export function RecoverPage() {
  const { recoverPassword } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirm: '' },
  })

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold tracking-tight">Recuperar acceso</h1>
      <p className="mt-2 mb-7 text-center text-sm text-mute">
        Si el correo está registrado, podrás definir una nueva contraseña.
      </p>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await recoverPassword(values.email, values.password)
            toast.push('Contraseña actualizada')
            navigate('/login', { replace: true })
          } catch (error) {
            toast.push(error instanceof Error ? error.message : 'No se pudo recuperar', 'error')
          }
        })}
      >
        <Field label="Correo" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register('email')} />
        </Field>
        <Field label="Nueva contraseña" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        <Field label="Confirmar" error={form.formState.errors.confirm?.message}>
          <Input type="password" {...form.register('confirm')} />
        </Field>
        <Button type="submit" block disabled={form.formState.isSubmitting}>
          Actualizar contraseña
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-mute">
        <Link to="/login" className="font-medium text-mint">
          Volver a entrar
        </Link>
      </p>
    </div>
  )
}
