import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Confirm } from '../../components/ui/Confirm'
import { Field, Input, Select } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/Toast'
import { careKinds } from '../../data/catalog'
import { PetSheet } from '../../features/pets/PetSheet'
import { shortDate, todayISO } from '../../lib/format'
import { useStore } from '../../store/StoreProvider'
import type { PetCareKind } from '../../types'

const weightSchema = z.object({
  weight: z.number().positive('Peso inválido'),
  date: z.string().min(1),
})

const careSchema = z.object({
  kind: z.enum(['comida', 'paseo', 'veterinario', 'medicina', 'higiene', 'otro']),
  note: z.string().max(120).optional(),
  date: z.string().min(1),
})

export function PetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { household, state, addPetWeight, addPetCare, removePet } = useStore()
  const pet = state.pets.find((p) => p.id === id && p.householdId === household?.id)
  const [edit, setEdit] = useState(false)
  const [weightOpen, setWeightOpen] = useState(false)
  const [careOpen, setCareOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)

  const weights = useMemo(
    () =>
      state.petWeights
        .filter((w) => w.petId === id)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date)),
    [id, state.petWeights],
  )
  const cares = useMemo(
    () => state.petCares.filter((c) => c.petId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [id, state.petCares],
  )

  const weightForm = useForm({
    resolver: zodResolver(weightSchema),
    defaultValues: { weight: pet?.weight ?? 0, date: todayISO() },
  })
  const careForm = useForm({
    resolver: zodResolver(careSchema),
    defaultValues: { kind: 'comida' as PetCareKind, note: '', date: todayISO() },
  })

  if (!pet) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-mute">Esta mascota no existe o no pertenece a tu hogar.</p>
        <Link to="/mascotas" className="mt-3 inline-block text-sm text-mint">
          Volver
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/mascotas" className="inline-flex items-center gap-2 text-sm text-mute">
          <ArrowLeft size={16} />
          Mascotas
        </Link>
        <button type="button" className="text-sm text-mint" onClick={() => setEdit(true)}>
          Editar
        </button>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="aspect-[16/8] bg-lift">
          {pet.photo ? (
            <img src={pet.photo} alt={pet.name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-mute">Sin foto</div>
          )}
        </div>
        <div className="p-4">
          <h1 className="text-[22px] font-semibold tracking-tight">{pet.name}</h1>
          <p className="text-sm text-mute">
            {pet.species} · {pet.weight ? `${pet.weight} kg` : 'Sin peso'}
          </p>
          <p className="mt-2 text-sm text-mute">
            {pet.nextVaccine ? `Próxima vacuna ${shortDate(pet.nextVaccine)}` : 'Sin vacuna programada'}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => setWeightOpen(true)}>
          Registrar peso
        </Button>
        <Button variant="secondary" onClick={() => setCareOpen(true)}>
          Registrar cuidado
        </Button>
      </div>

      <Card>
        <h2 className="mb-3 text-[15px] font-semibold">Historial de peso</h2>
        {weights.length < 2 ? (
          <p className="py-6 text-center text-sm text-mute">Registra al menos dos pesos para ver la curva.</p>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weights.map((w) => ({ ...w, label: shortDate(w.date) }))}>
                <CartesianGrid stroke="#303030" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#929292" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#929292" fontSize={12} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{ background: '#151515', border: '1px solid #303030', borderRadius: 12 }}
                />
                <Line type="monotone" dataKey="weight" stroke="#55D6A0" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 text-[15px] font-semibold">Cuidados</h2>
        {cares.length === 0 ? (
          <p className="py-6 text-center text-sm text-mute">Aún no hay cuidados registrados.</p>
        ) : (
          <ul className="divide-y divide-line">
            {cares.map((care) => (
              <li key={care.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium capitalize">{care.kind}</p>
                  <p className="text-xs text-mute">{care.note || 'Sin nota'}</p>
                </div>
                <span className="text-xs text-mute">{shortDate(care.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button variant="danger" block onClick={() => setRemoveOpen(true)}>
        Eliminar mascota
      </Button>

      <PetSheet open={edit} editing={pet} onClose={() => setEdit(false)} />

      <Sheet open={weightOpen} title="Nuevo peso" onClose={() => setWeightOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={weightForm.handleSubmit((values) => {
            addPetWeight(pet.id, values.weight, values.date)
            toast.push('Peso registrado')
            setWeightOpen(false)
          })}
        >
          <Field label="Peso (kg)" error={weightForm.formState.errors.weight?.message}>
            <Input type="number" step="0.1" {...weightForm.register('weight', { valueAsNumber: true })} />
          </Field>
          <Field label="Fecha">
            <Input type="date" {...weightForm.register('date')} />
          </Field>
          <Button type="submit" block>
            Guardar
          </Button>
        </form>
      </Sheet>

      <Sheet open={careOpen} title="Nuevo cuidado" onClose={() => setCareOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={careForm.handleSubmit((values) => {
            addPetCare(pet.id, values.kind, values.note ?? '', values.date)
            toast.push('Cuidado registrado')
            setCareOpen(false)
          })}
        >
          <Field label="Tipo">
            <Select {...careForm.register('kind')}>
              {careKinds.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nota">
            <Input {...careForm.register('note')} />
          </Field>
          <Field label="Fecha">
            <Input type="date" {...careForm.register('date')} />
          </Field>
          <Button type="submit" block>
            Guardar
          </Button>
        </form>
      </Sheet>

      <Confirm
        open={removeOpen}
        title="Eliminar mascota"
        text="Se borrarán foto, pesos y cuidados de esta mascota."
        confirmLabel="Eliminar"
        danger
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          removePet(pet.id)
          navigate('/mascotas')
        }}
      />
    </div>
  )
}
