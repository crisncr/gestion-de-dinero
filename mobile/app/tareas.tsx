import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { BackHeader } from '../src/BackHeader'
import { DatePickerField, datePresets } from '../src/DatePickerField'
import { MonthFilterSheet, pickedLabel } from '../src/MonthFilterSheet'
import { Screen } from '../src/Screen'
import { monthKey, shortDate, todayISO } from '../src/lib/format'
import { useStore } from '../src/store/StoreProvider'
import { colors, fonts } from '../src/theme'
import type { Priority } from '../src/types'
import { Button, Card, Chip, Empty, Field, Sheet, useToast } from '../src/ui'

export default function TasksScreen() {
  const { household, members, state, addTask, toggleTask, removeTask } = useStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState(todayISO())
  const [assigned, setAssigned] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterMonth, setFilterMonth] = useState<string | null>(null)
  const [filterDay, setFilterDay] = useState<string | null>(null)
  const tasks = useMemo(
    () =>
      state.tasks
        .filter((t) => t.householdId === household?.id && !t.done)
        .filter((t) => {
          if (!filterMonth && !filterDay) return true
          if (!t.dueDate) return false
          if (filterDay) return t.dueDate === filterDay
          return t.dueDate.startsWith(filterMonth as string)
        })
        .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')),
    [filterDay, filterMonth, household?.id, state.tasks],
  )

  return (
    <Screen>
      <BackHeader
        title="Tareas"
        action={
          <Button
            title="+ Tarea"
            size="sm"
            onPress={() => {
              setDueDate(filterDay || (filterMonth ? `${filterMonth}-01` : todayISO()))
              setOpen(true)
            }}
          />
        }
      />
      <Text style={{ color: colors.mute, fontFamily: fonts.regular }}>
        {filterMonth || filterDay
          ? `Mostrando ${pickedLabel(filterMonth, filterDay)}.`
          : 'Una tarea se marca cuando se hizo. Un aviso es solo un recordatorio de fecha, como el pago de la luz.'}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => setFilterOpen(true)}>
          <Text style={{ color: colors.mint, fontFamily: fonts.semibold }}>Ver tareas por fecha</Text>
        </Pressable>
        {filterMonth || filterDay ? (
          <Pressable onPress={() => { setFilterMonth(null); setFilterDay(null) }}>
            <Text style={{ color: colors.mute, fontFamily: fonts.semibold }}>Ver todas</Text>
          </Pressable>
        ) : null}
      </View>
      <Card>
        {tasks.length === 0 ? (
          <Empty title="Nada por aquí" text="Crea una tarea del hogar con fecha, por ejemplo sacar la basura el jueves." />
        ) : (
          tasks.map((task) => {
            const assignee = members.find((m) => m.id === task.assignedMemberId)
            return (
              <View key={task.id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line }}>
                <Pressable
                  onPress={() => toggleTask(task.id)}
                  style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.lift, marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.cream, fontFamily: fonts.semibold }}>{task.title}</Text>
                  <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 4 }}>
                    {assignee?.name ?? 'Sin asignar'}
                    {task.dueDate ? ` · ${shortDate(task.dueDate)}` : ''}
                    {task.priority === 'high' ? ' · urgente' : ''}
                  </Text>
                </View>
                <Pressable onPress={() => removeTask(task.id)}>
                  <Text style={{ color: colors.danger, fontSize: 12, fontFamily: fonts.semibold }}>Quitar</Text>
                </Pressable>
              </View>
            )
          })
        )}
      </Card>
      <Sheet
        open={open}
        title="Nueva tarea"
        subtitle="Algo que hay que hacer y tachar. Si solo quieres acordarte de una fecha, usa Aviso."
        onClose={() => setOpen(false)}
      >
        <Field label="Qué hay que hacer" placeholder="Pasear a los gatos, pagar el agua..." value={title} onChangeText={setTitle} />
        <DatePickerField label="Para cuándo" value={dueDate} onChange={setDueDate} presets={datePresets('event')} />
        {members.length > 0 ? (
          <View>
            <Text style={{ color: colors.mute, fontSize: 13, fontFamily: fonts.semibold, marginBottom: 10 }}>Quién la hace</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="Sin asignar" active={!assigned} onPress={() => setAssigned(null)} />
              {members.map((member) => (
                <Chip key={member.id} label={member.name} active={assigned === member.id} onPress={() => setAssigned(member.id)} />
              ))}
            </View>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['low', 'medium', 'high'] as const).map((p) => (
            <Chip key={p} label={p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : 'Alta'} active={priority === p} onPress={() => setPriority(p)} />
          ))}
        </View>
        <Button
          title="Guardar tarea"
          onPress={() => {
            if (title.trim().length < 2) return toast.push('Escribe la tarea')
            addTask({ title, assignedMemberId: assigned, dueDate, priority })
            setFilterMonth(monthKey(dueDate))
            setFilterDay(null)
            setTitle('')
            setDueDate(todayISO())
            setAssigned(null)
            setOpen(false)
            toast.push('Tarea creada en ese mes')
          }}
        />
      </Sheet>
      <MonthFilterSheet
        open={filterOpen}
        title="Ver tareas por fecha"
        initialMonth={filterMonth || monthKey()}
        onClose={() => setFilterOpen(false)}
        onAccept={(month, day) => {
          setFilterMonth(month)
          setFilterDay(day)
        }}
      />
    </Screen>
  )
}
