import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toast'
import { useStore } from '../../store/StoreProvider'

const profileSchema = z.object({
  name: z.string().min(2, 'Escribe tu nombre').max(40),
})

const householdSchema = z.object({
  name: z.string().min(2).max(40),
  monthlyBudget: z.number().min(0),
})

const passwordSchema = z
  .object({
    current: z.string().min(8),
    next: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string().min(8),
  })
  .refine((v) => v.next === v.confirm, { path: ['confirm'], message: 'No coinciden' })

export function SettingsPage() {
  const { currentUser, household, canManage, updateProfile, updateHousehold, changePassword, logout } =
    useStore()
  const toast = useToast()

  const profile = useForm({
    resolver: zodResolver(profileSchema),
    values: { name: currentUser?.name ?? '' },
  })
  const home = useForm({
    resolver: zodResolver(householdSchema),
    values: { name: household?.name ?? '', monthlyBudget: household?.monthlyBudget ?? 0 },
  })
  const pass = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: '', next: '', confirm: '' },
  })

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold tracking-tight">Ajustes</h1>

      <Card>
        <h2 className="mb-4 text-[15px] font-semibold">Perfil</h2>
        <form
          className="space-y-3"
          onSubmit={profile.handleSubmit((values) => {
            updateProfile(values.name)
            toast.push('Perfil actualizado')
          })}
        >
          <Field label="Nombre" error={profile.formState.errors.name?.message}>
            <Input {...profile.register('name')} />
          </Field>
          <Field label="Correo">
            <Input value={currentUser?.email ?? ''} disabled />
          </Field>
          <Button type="submit">Guardar perfil</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-[15px] font-semibold">Hogar</h2>
        <form
          className="space-y-3"
          onSubmit={home.handleSubmit((values) => {
            try {
              updateHousehold(values)
              toast.push('Hogar actualizado')
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'Sin permiso', 'error')
            }
          })}
        >
          <Field label="Nombre del hogar" error={home.formState.errors.name?.message}>
            <Input disabled={!canManage} {...home.register('name')} />
          </Field>
          <Field label="Presupuesto mensual" error={home.formState.errors.monthlyBudget?.message}>
            <Input type="number" min="0" disabled={!canManage} {...home.register('monthlyBudget', { valueAsNumber: true })} />
          </Field>
          <p className="text-xs text-mute">Moneda: {household?.currency ?? 'CLP'}</p>
          {canManage ? <Button type="submit">Guardar hogar</Button> : <p className="text-sm text-mute">Solo el titular o un administrador puede editar el hogar.</p>}
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-[15px] font-semibold">Contraseña</h2>
        <form
          className="space-y-3"
          onSubmit={pass.handleSubmit(async (values) => {
            try {
              await changePassword(values.current, values.next)
              pass.reset()
              toast.push('Contraseña actualizada')
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'No se pudo cambiar', 'error')
            }
          })}
        >
          <Field label="Actual" error={pass.formState.errors.current?.message}>
            <Input type="password" {...pass.register('current')} />
          </Field>
          <Field label="Nueva" error={pass.formState.errors.next?.message}>
            <Input type="password" {...pass.register('next')} />
          </Field>
          <Field label="Confirmar" error={pass.formState.errors.confirm?.message}>
            <Input type="password" {...pass.register('confirm')} />
          </Field>
          <Button type="submit">Cambiar contraseña</Button>
        </form>
      </Card>

      <Button variant="secondary" block onClick={logout}>
        Cerrar sesión
      </Button>
    </div>
  )
}
