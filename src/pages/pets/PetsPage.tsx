import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PetSheet } from '../../features/pets/PetSheet'
import { shortDate } from '../../lib/format'
import { useStore } from '../../store/StoreProvider'
import { useState } from 'react'

export function PetsPage() {
  const { household, state } = useStore()
  const [open, setOpen] = useState(false)
  const pets = state.pets.filter((p) => p.householdId === household?.id)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Mascotas</h1>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-mint px-3 text-sm font-semibold text-ink"
        >
          <Plus size={16} />
          Mascota
        </button>
      </div>

      {pets.length === 0 ? (
        <Card>
          <EmptyState
            icon={Plus}
            title="Sin mascotas"
            text="Agrega una mascota para seguir peso, vacunas y cuidados."
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pets.map((pet) => (
            <Link key={pet.id} to={`/mascotas/${pet.id}`}>
              <Card padding={false} className="overflow-hidden">
                <div className="aspect-[16/10] bg-lift">
                  {pet.photo ? (
                    <img src={pet.photo} alt={pet.name} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-sm text-mute">Sin foto</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold">{pet.name}</p>
                  <p className="text-sm text-mute">
                    {pet.species} · {pet.weight ? `${pet.weight} kg` : 'Sin peso'}
                  </p>
                  <p className="mt-2 text-xs text-mute">
                    {pet.nextVaccine ? `Próxima vacuna ${shortDate(pet.nextVaccine)}` : 'Sin vacuna programada'}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <PetSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
