import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { GlowPanel } from '../../src/GlowPanel'
import { MonthBar } from '../../src/MonthBar'
import { Screen } from '../../src/Screen'
import { SpendRing } from '../../src/SpendRing'
import { TransactionSheet } from '../../src/TransactionSheet'
import { categoryAccent, categoryLabel, expenseCategories, incomeCategories } from '../../src/data/catalog'
import { currencyCaption } from '../../src/data/currencies'
import { money, monthKey, shortDate, todayISO } from '../../src/lib/format'
import { useStore } from '../../src/store/StoreProvider'
import { colors, fonts } from '../../src/theme'
import type { Transaction, TxType } from '../../src/types'
import { Button, Chip, Empty, Progress, useToast } from '../../src/ui'

export default function FinanceScreen() {
  const { household, state, members, removeTransaction, refresh } = useStore()
  const toast = useToast()
  const currency = household?.currency ?? 'CLP'
  const [open, setOpen] = useState(false)
  const [sheetType, setSheetType] = useState<TxType>('expense')
  const [filter, setFilter] = useState<'all' | TxType>('all')
  const [month, setMonth] = useState(monthKey())
  const sheetDate = month === monthKey() ? todayISO() : `${month}-01`

  const monthTx = useMemo(
    () => state.transactions.filter((t) => t.householdId === household?.id && t.date.startsWith(month)),
    [household?.id, month, state.transactions],
  )
  const monthIncome = monthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const monthExpenses = monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const monthSalary = monthTx
    .filter((t) => t.type === 'income' && t.category === 'sueldo')
    .reduce((sum, t) => sum + t.amount, 0)
  const monthContributions = monthTx
    .filter((t) => t.type === 'income' && t.category === 'aporte')
    .reduce((sum, t) => sum + t.amount, 0)
  const remaining = monthIncome - monthExpenses
  const usedPct = monthIncome > 0 ? (monthExpenses / monthIncome) * 100 : monthExpenses > 0 ? 100 : 0

  const rows = useMemo(
    () =>
      state.transactions
        .filter((t) => t.householdId === household?.id && t.date.startsWith(month))
        .filter((t) => (filter === 'all' ? true : t.type === filter))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [filter, household?.id, month, state.transactions],
  )

  const pie = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of state.transactions.filter((r) => r.householdId === household?.id && r.date.startsWith(month) && r.type === 'expense')) {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
    }
    const total = [...map.values()].reduce((s, n) => s + n, 0) || 1
    return [...map.entries()].map(([id, value]) => ({
      id,
      name: categoryLabel(id, expenseCategories),
      value,
      pct: (value / total) * 100,
      color: categoryAccent(id),
    }))
  }, [household?.id, month, state.transactions])

  return (
    <Screen onRefresh={refresh}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: colors.mint, fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.6 }}>PULSO</Text>
          <Text style={{ color: colors.cream, fontSize: 30, fontFamily: fonts.extra, marginTop: 4 }}>Finanzas</Text>
        </View>
        <Button
          title="Registrar"
          size="sm"
          onPress={() => {
            setSheetType('expense')
            setOpen(true)
          }}
        />
      </View>
      <MonthBar value={month} onChange={setMonth} />

      <GlowPanel style={{ alignItems: 'center', paddingVertical: 22 }}>
        <SpendRing
          slices={pie.map((slice) => ({ pct: slice.pct, color: slice.color }))}
          centerLabel="Gastado este mes"
          centerValue={money(monthExpenses, currency)}
        />
        <Text style={{ color: 'rgba(85,214,160,0.8)', fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.4, marginTop: 14 }}>
          CARTERA VIVA
        </Text>
        <Text style={{ color: colors.cream, fontSize: 34, fontFamily: fonts.extra, marginTop: 6, letterSpacing: -0.6 }}>
          {money(remaining, currency)}
        </Text>
        <Text style={{ color: colors.mute, marginTop: 6, fontFamily: fonts.regular, textAlign: 'center' }}>
          {currencyCaption(currency)} · lo que entró menos lo que se gastó
        </Text>
        {monthIncome > 0 ? (
          <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular }}>Uso del mes</Text>
              <Text style={{ color: usedPct >= 80 ? colors.warn : colors.mint, fontSize: 12, fontFamily: fonts.semibold }}>
                {Math.round(usedPct)}%
              </Text>
            </View>
            <Progress value={usedPct} />
          </View>
        ) : null}
      </GlowPanel>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            setSheetType('income')
            setOpen(true)
          }}
        >
          <View
            style={{
              backgroundColor: '#101210',
              borderRadius: 20,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(85,214,160,0.28)',
            }}
          >
            <Text style={{ color: colors.mute, fontSize: 10, fontFamily: fonts.semibold, letterSpacing: 0.6 }}>Ingresos</Text>
            <Text style={{ color: colors.mint, fontSize: 18, fontFamily: fonts.bold, marginTop: 8 }} numberOfLines={1}>
              {money(monthIncome, currency)}
            </Text>
            <Text style={{ color: colors.mute, fontSize: 11, fontFamily: fonts.regular, marginTop: 8 }}>
              Sueldo {money(monthSalary, currency)}
            </Text>
          </View>
        </Pressable>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            setSheetType('expense')
            setOpen(true)
          }}
        >
          <View
            style={{
              backgroundColor: '#101210',
              borderRadius: 20,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          >
            <Text style={{ color: colors.mute, fontSize: 10, fontFamily: fonts.semibold, letterSpacing: 0.6 }}>Gastos</Text>
            <Text style={{ color: colors.cream, fontSize: 18, fontFamily: fonts.bold, marginTop: 8 }} numberOfLines={1}>
              {money(monthExpenses, currency)}
            </Text>
            <Text style={{ color: colors.mute, fontSize: 11, fontFamily: fonts.regular, marginTop: 8 }}>
              Queda {money(remaining, currency)}
            </Text>
          </View>
        </Pressable>
      </View>

      <View
        style={{
          backgroundColor: '#101210',
          borderRadius: 26,
          borderWidth: 1,
          borderColor: colors.line,
          padding: 18,
        }}
      >
        <Text style={{ color: colors.cream, fontFamily: fonts.bold }}>De dónde salió el dinero</Text>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 6, marginBottom: 10, fontSize: 12, lineHeight: 18 }}>
          El sueldo no es fijo: cada mes registras el que llegó, y un familiar puede aportar el suyo.
        </Text>
        {[
          ['Sueldo', monthSalary, colors.mint],
          ['Aporte familiar', monthContributions, '#A78BFA'],
          ['Otros ingresos', Math.max(0, monthIncome - monthSalary - monthContributions), '#5B8CFF'],
        ].map(([label, value, accent]) => (
          <View key={String(label)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: String(accent) }} />
              <Text style={{ color: colors.mute, fontFamily: fonts.regular }}>{label}</Text>
            </View>
            <Text style={{ color: colors.cream, fontFamily: fonts.semibold }}>{money(Number(value), currency)}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Todos" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Gastos" active={filter === 'expense'} onPress={() => setFilter('expense')} />
        <Chip label="Ingresos" active={filter === 'income'} onPress={() => setFilter('income')} />
      </View>

      <View
        style={{
          backgroundColor: '#101210',
          borderRadius: 26,
          borderWidth: 1,
          borderColor: colors.line,
          padding: 18,
        }}
      >
        <Text style={{ color: colors.cream, fontFamily: fonts.bold, marginBottom: 12 }}>Por categoría</Text>
        {pie.length === 0 ? (
          <Empty title="Sin gastos" text="Registra un gasto y elige el tipo de producto." />
        ) : (
          pie.map((slice) => (
            <View key={slice.id} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: slice.color }} />
                  <Text style={{ color: colors.mute, fontFamily: fonts.regular }}>{slice.name}</Text>
                </View>
                <Text style={{ color: colors.cream, fontFamily: fonts.semibold }}>{money(slice.value, currency)}</Text>
              </View>
              <View style={{ height: 7, backgroundColor: colors.lift, borderRadius: 99, overflow: 'hidden' }}>
                <View style={{ width: `${slice.pct}%`, height: 7, backgroundColor: slice.color, borderRadius: 99 }} />
              </View>
            </View>
          ))
        )}
      </View>

      <View
        style={{
          backgroundColor: '#101210',
          borderRadius: 26,
          borderWidth: 1,
          borderColor: colors.line,
          padding: 18,
        }}
      >
        <Text style={{ color: colors.cream, fontFamily: fonts.bold, marginBottom: 4 }}>Movimientos del mes</Text>
        {rows.length === 0 ? (
          <Empty title="Sin movimientos" text="Registra un ingreso o gasto para este mes." />
        ) : (
          rows.map((row) => (
            <TxRow
              key={row.id}
              row={row}
              currency={currency}
              memberName={members.find((member) => member.id === row.memberId)?.name}
              onRemove={() => {
                removeTransaction(row.id)
                toast.push('Movimiento eliminado')
              }}
            />
          ))
        )}
      </View>

      <TransactionSheet
        open={open}
        initialType={sheetType}
        initialDate={sheetDate}
        onClose={() => setOpen(false)}
        onSaved={(date) => setMonth(monthKey(date))}
      />
    </Screen>
  )
}

function TxRow({
  row,
  currency,
  memberName,
  onRemove,
}: {
  row: Transaction
  currency: string
  memberName?: string
  onRemove: () => void
}) {
  const cats = row.type === 'income' ? incomeCategories : expenseCategories
  const accent = categoryAccent(row.category)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.line }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: `${accent}18`,
          borderWidth: 1,
          borderColor: `${accent}33`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.cream, fontFamily: fonts.semibold }}>
          {row.description || categoryLabel(row.category, cats)}
        </Text>
        <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>
          {categoryLabel(row.category, cats)}
          {row.type === 'income' && memberName ? ` · ${memberName}` : ''}
          {' · '}
          {shortDate(row.date)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: row.type === 'income' ? colors.mint : colors.cream, fontFamily: fonts.bold }}>
          {row.type === 'income' ? '+' : '−'}
          {money(row.amount, currency)}
        </Text>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={{ color: colors.danger, fontSize: 11, marginTop: 4, fontFamily: fonts.semibold }}>Quitar</Text>
        </Pressable>
      </View>
    </View>
  )
}
