import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toast'
import { useStore } from '../../store/StoreProvider'

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold tracking-tight">Entrar a Casa360</h1>
      <p className="mt-2 mb-7 text-center text-sm text-mute">Usa tu cuenta del hogar para continuar.</p>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await login(values.email, values.password)
            navigate(from, { replace: true })
          } catch (error) {
            toast.push(error instanceof Error ? error.message : 'No se pudo entrar', 'error')
          }
        })}
      >
        <Field label="Correo" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Field label="Contraseña" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...form.register('password')} />
        </Field>
        <div className="flex justify-end">
          <Link to="/recuperar" className="text-sm text-mute hover:text-cream">
            Recuperar contraseña
          </Link>
        </div>
        <Button type="submit" block disabled={form.formState.isSubmitting}>
          Entrar
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-mute">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="font-medium text-mint">
          Crear hogar
        </Link>
      </p>
    </div>
  )
}
