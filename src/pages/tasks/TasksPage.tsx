import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Checkbox } from '../../components/ui/Checkbox'
import { Chip } from '../../components/ui/Chip'
import { EmptyState } from '../../components/ui/EmptyState'
import { TaskSheet } from '../../features/tasks/TaskSheet'
import { shortDate, todayISO } from '../../lib/format'
import { useStore } from '../../store/StoreProvider'
import type { TaskItem } from '../../types'

export function TasksPage() {
  const { household, members, membership, state, toggleTask, removeTask } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TaskItem | null>(null)
  const [filter, setFilter] = useState<'pending' | 'mine' | 'done'>('pending')

  const tasks = useMemo(() => {
    return state.tasks
      .filter((t) => t.householdId === household?.id)
      .filter((t) => {
        if (filter === 'done') return t.done
        if (filter === 'mine') return !t.done && t.assignedMemberId === membership?.id
        return !t.done
      })
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.priority] - order[b.priority] || (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
      })
  }, [filter, household?.id, membership?.id, state.tasks])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Tareas</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-mint px-3 text-sm font-semibold text-ink"
        >
          <Plus size={16} />
          Tarea
        </button>
      </div>

      <div className="flex gap-2">
        <Chip active={filter === 'pending'} onClick={() => setFilter('pending')}>
          Pendientes
        </Chip>
        <Chip active={filter === 'mine'} onClick={() => setFilter('mine')}>
          Mías
        </Chip>
        <Chip active={filter === 'done'} onClick={() => setFilter('done')}>
          Hechas
        </Chip>
      </div>

      <Card padding={false}>
        {tasks.length === 0 ? (
          <EmptyState icon={Plus} title="Nada por aquí" text="Crea una tarea o cambia el filtro." />
        ) : (
          <ul className="divide-y divide-line">
            {tasks.map((task) => {
              const assignee = members.find((m) => m.id === task.assignedMemberId)
              const overdue = Boolean(task.dueDate && !task.done && task.dueDate < todayISO())
              return (
                <li key={task.id} className="flex items-start gap-3 px-4 py-3">
                  <Checkbox checked={task.done} onChange={() => toggleTask(task.id)} />
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setEditing(task)
                      setOpen(true)
                    }}
                  >
                    <p className={`text-sm font-medium ${task.done ? 'text-mute line-through' : ''}`}>
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-mute">
                      {assignee ? assignee.name : 'Sin asignar'}
                      {task.dueDate ? ` · ${shortDate(task.dueDate)}` : ''}
                    </p>
                  </button>
                  <span
                    className={
                      task.priority === 'high'
                        ? 'mt-1 size-2 rounded-full bg-danger'
                        : task.priority === 'medium'
                          ? 'mt-1 size-2 rounded-full bg-warn'
                          : 'mt-1 size-2 rounded-full bg-mute'
                    }
                  />
                  {overdue ? <span className="text-[11px] text-danger">Vencida</span> : null}
                  <button type="button" className="text-xs text-mute" onClick={() => removeTask(task.id)}>
                    Quitar
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <TaskSheet
        open={open}
        editing={editing}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}
