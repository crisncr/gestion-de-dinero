import { Copy, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Confirm } from '../../components/ui/Confirm'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, Input } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toast'
import { MemberSheet } from '../../features/family/MemberSheet'
import { shortDate } from '../../lib/format'
import { useStore } from '../../store/StoreProvider'
import type { Member } from '../../types'

const roleLabel = {
  owner: 'Titular',
  admin: 'Administrador',
  member: 'Integrante',
} as const

export function FamilyPage() {
  const { household, members, canManage, state, joinHousehold, removeMember } = useStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [code, setCode] = useState('')
  const [removing, setRemoving] = useState<Member | null>(null)

  const activity = useMemo(() => {
    if (!household) return []
    const txs = state.transactions
      .filter((t) => t.householdId === household.id)
      .slice(0, 6)
      .map((t) => {
        const member = members.find((m) => m.id === t.memberId)
        return {
          id: t.id,
          title: t.description || (t.type === 'income' ? 'Ingreso' : 'Gasto'),
          meta: member ? member.name : 'Integrante',
          date: t.date,
        }
      })
    return txs
  }, [household, members, state.transactions])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Familia</h1>
        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-mint px-3 text-sm font-semibold text-ink"
          >
            <UserPlus size={16} />
            Integrante
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((member) => {
          const assigned = state.tasks.filter(
            (t) => t.householdId === household?.id && t.assignedMemberId === member.id && !t.done,
          ).length
          return (
            <Card key={member.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={member.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{member.name}</p>
                  <p className="text-xs text-mute">{roleLabel[member.role]}</p>
                  <p className="mt-2 text-xs text-mute">
                    {assigned === 0 ? 'Sin tareas pendientes' : `${assigned} tarea${assigned === 1 ? '' : 's'}`}
                  </p>
                </div>
                {canManage && member.role !== 'owner' ? (
                  <button
                    type="button"
                    className="text-xs text-mute"
                    onClick={() => {
                      setEditing(member)
                      setOpen(true)
                    }}
                  >
                    Editar
                  </button>
                ) : null}
              </div>
              {canManage && member.role !== 'owner' ? (
                <button
                  type="button"
                  className="mt-3 text-xs text-danger"
                  onClick={() => setRemoving(member)}
                >
                  Quitar del hogar
                </button>
              ) : null}
            </Card>
          )
        })}
      </div>

      {household ? (
        <Card>
          <h2 className="text-[15px] font-semibold">Invitaciones</h2>
          <p className="mt-1 text-sm text-mute">
            Comparte este código para que otra cuenta se una al hogar.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <p className="flex-1 rounded-2xl bg-lift px-4 py-3 font-mono text-lg tracking-[0.3em]">
              {household.inviteCode}
            </p>
            <Button
              variant="secondary"
              icon={<Copy size={16} />}
              onClick={async () => {
                await navigator.clipboard.writeText(household.inviteCode)
                toast.push('Código copiado')
              }}
            >
              Copiar
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-[15px] font-semibold">Unirse a otro hogar</h2>
        <form
          className="mt-3 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            try {
              joinHousehold(code)
              setCode('')
              toast.push('Te uniste al hogar')
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'No se pudo unir', 'error')
            }
          }}
        >
          <div className="min-w-0 flex-1">
            <Field label="Código">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
              />
            </Field>
          </div>
          <Button type="submit">Unirme</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-2 text-[15px] font-semibold">Actividad reciente</h2>
        {activity.length === 0 ? (
          <EmptyState icon={UserPlus} title="Sin actividad" text="Los movimientos del hogar aparecerán aquí." />
        ) : (
          <ul className="divide-y divide-line">
            {activity.map((row) => (
              <li key={row.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{row.title}</p>
                  <p className="text-xs text-mute">{row.meta}</p>
                </div>
                <span className="text-xs text-mute">{shortDate(row.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <MemberSheet
        open={open}
        editing={editing}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
      />
      <Confirm
        open={Boolean(removing)}
        title="Quitar integrante"
        text={`${removing?.name ?? ''} dejará de aparecer en este hogar.`}
        confirmLabel="Quitar"
        danger
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) removeMember(removing.id)
        }}
      />
    </div>
  )
}
