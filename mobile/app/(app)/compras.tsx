import { Check, Search } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { DatePickerField, datePresets } from '../../src/DatePickerField'
import { GlowPanel } from '../../src/GlowPanel'
import { MonthBar } from '../../src/MonthBar'
import { Screen } from '../../src/Screen'
import { categoryLabel, shoppingCategories } from '../../src/data/catalog'
import { money, monthKey, shoppingCharge, stampOnDate, todayISO } from '../../src/lib/format'
import { useStore } from '../../src/store/StoreProvider'
import { colors, fonts } from '../../src/theme'
import { Button, Chip, Empty, Field, Progress, Sheet, useToast } from '../../src/ui'

const shopAccent: Record<string, string> = {
  mercado: '#55D6A0',
  limpieza: '#38BDF8',
  farmacia: '#E06A6A',
  mascotas: '#A78BFA',
  hogar: '#E0B15A',
  otros: '#8E8E8E',
}

export default function ShoppingScreen() {
  const { household, state, addShopping, toggleShopping, removeShopping, clearPurchased, refresh } = useStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [qty, setQty] = useState('1')
  const [price, setPrice] = useState('')
  const [offer, setOffer] = useState('')
  const [promo, setPromo] = useState(false)
  const [itemDate, setItemDate] = useState(todayISO())
  const currency = household?.currency ?? 'CLP'
  const addCategory = filter === 'all' ? 'mercado' : filter
  const [month, setMonth] = useState(monthKey())

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.shopping
      .filter((s) => s.householdId === household?.id && s.createdAt.slice(0, 7) === month)
      .filter((s) => (filter === 'all' ? true : s.category === filter))
      .filter((s) => (q ? s.name.toLowerCase().includes(q) : true))
      .sort((a, b) => Number(a.purchased) - Number(b.purchased))
  }, [filter, household?.id, month, query, state.shopping])

  const pendingInView = items.filter((item) => !item.purchased)
  const pendingTotal = pendingInView.reduce((sum, item) => sum + shoppingCharge(item), 0)
  const monthIncome = state.transactions
    .filter((t) => t.householdId === household?.id && t.type === 'income' && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0)
  const filterLabel = filter === 'all' ? 'todos' : categoryLabel(filter, shoppingCategories).toLowerCase()

  return (
    <Screen onRefresh={refresh}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: colors.mint, fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.6 }}>LISTA</Text>
          <Text style={{ color: colors.cream, fontSize: 30, fontFamily: fonts.extra, marginTop: 4 }}>Compras</Text>
          <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 8 }}>
            {household?.name ?? 'Tu hogar'} · {pendingInView.length} pendiente{pendingInView.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Button
          title="+ Producto"
          size="sm"
          onPress={() => {
            setItemDate(month === monthKey() ? todayISO() : `${month}-01`)
            setOpen(true)
          }}
        />
      </View>
      <MonthBar value={month} onChange={setMonth} />

      <GlowPanel>
        <Text style={{ color: 'rgba(85,214,160,0.8)', fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.4 }}>
          PENDIENTE EN LISTA
        </Text>
        <Text style={{ color: colors.cream, fontSize: 36, fontFamily: fonts.extra, marginTop: 10, letterSpacing: -0.8 }}>
          {money(pendingTotal, currency)}
        </Text>
        <Text style={{ color: colors.mute, marginTop: 8, fontFamily: fonts.regular, lineHeight: 18 }}>
          {pendingInView.length} de {filterLabel} · al marcarlos comprados salen de la cartera
        </Text>
        <View style={{ marginTop: 14 }}>
          <Progress value={monthIncome > 0 ? (pendingTotal / monthIncome) * 100 : 0} />
        </View>
      </GlowPanel>

      <Field label="Buscar" icon={Search} placeholder="Leche, arena, jabón..." value={query} onChangeText={setQuery} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label="Todos" active={filter === 'all'} onPress={() => setFilter('all')} />
        {shoppingCategories.map((c) => (
          <Chip key={c.id} label={c.label} active={filter === c.id} onPress={() => setFilter(c.id)} />
        ))}
      </View>

      <View
        style={{
          backgroundColor: '#101210',
          borderRadius: 26,
          borderWidth: 1,
          borderColor: colors.line,
          paddingHorizontal: 16,
          paddingVertical: 6,
        }}
      >
        {items.length === 0 ? (
          <Empty
            title={query ? 'Nada coincide' : filter === 'all' ? 'Este mes no tiene compras' : `Sin productos de ${filterLabel}`}
            text={filter === 'all' ? 'Cada mes tiene su propia lista. Agrega lo de este mes.' : `Agrega otro producto de ${filterLabel}.`}
          />
        ) : (
          items.map((item, index) => {
            const accent = shopAccent[item.category] ?? colors.mint
            return (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 14,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.line,
                }}
              >
                <Pressable
                  onPress={() => toggleShopping(item.id)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: item.purchased ? colors.mint : colors.line,
                    backgroundColor: item.purchased ? colors.mint : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.purchased ? <Check size={14} color={colors.ink} strokeWidth={3} /> : null}
                </Pressable>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: accent,
                    opacity: item.purchased ? 0.35 : 1,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: item.purchased ? colors.mute : colors.cream,
                      textDecorationLine: item.purchased ? 'line-through' : 'none',
                      fontFamily: fonts.semibold,
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>
                    {item.offerTotal
                      ? `${categoryLabel(item.category, shoppingCategories)} · promo · ×${item.quantity}`
                      : `${categoryLabel(item.category, shoppingCategories)} · ${money(item.price, currency)} c/u · ×${item.quantity}`}
                  </Text>
                </View>
                <Text style={{ color: item.purchased ? colors.mute : colors.cream, fontFamily: fonts.bold }}>
                  {money(shoppingCharge(item), currency)}
                </Text>
                <Pressable
                  onPress={() => {
                    removeShopping(item.id)
                    toast.push('Producto quitado')
                  }}
                >
                  <Text style={{ color: colors.danger, fontSize: 12, fontFamily: fonts.semibold }}>Quitar</Text>
                </Pressable>
              </View>
            )
          })
        )}
      </View>

      {items.some((i) => i.purchased) ? (
        <Button
          title="Quitar productos comprados"
          variant="secondary"
          onPress={() => clearPurchased(items.filter((item) => item.purchased).map((item) => item.id))}
        />
      ) : null}

      <Sheet
        open={open}
        title={filter === 'all' ? 'Nuevo producto' : `Producto de ${categoryLabel(addCategory, shoppingCategories).toLowerCase()}`}
        subtitle={
          filter === 'all'
            ? 'Se guarda en Mercado. Cambia el filtro si quieres Limpieza, Farmacia u otro.'
            : `Queda en ${categoryLabel(addCategory, shoppingCategories).toLowerCase()}. Luego solo ves esa lista.`
        }
        onClose={() => setOpen(false)}
      >
        <Field label="Producto" placeholder="Leche, pan, arena..." value={name} onChangeText={setName} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Precio normal" active={!promo} onPress={() => setPromo(false)} />
          <Chip label="Promo" active={promo} onPress={() => setPromo(true)} />
        </View>
        {promo ? (
          <>
            <Field label="Cantidad" keyboardType="numeric" value={qty} onChangeText={setQty} />
            <Field
              label={`Total de la promo (${currency})`}
              keyboardType="numeric"
              placeholder="3000"
              value={offer}
              onChangeText={setOffer}
            />
          </>
        ) : (
          <>
            <Field label={`Precio de cada uno (${currency})`} keyboardType="numeric" value={price} onChangeText={setPrice} />
            <Field label="Cantidad" keyboardType="numeric" value={qty} onChangeText={setQty} />
            <Text style={{ color: colors.cream, fontFamily: fonts.semibold }}>
              Total {money((Number(price) || 0) * Math.max(1, Number(qty) || 1), currency)}
            </Text>
          </>
        )}
        <DatePickerField label="Para qué mes" value={itemDate} onChange={setItemDate} presets={datePresets('event')} />
        <Button
          title="Guardar"
          onPress={() => {
            if (name.trim().length < 2) return toast.push('Escribe el producto')
            const count = Math.max(1, Number(qty) || 1)
            const offerValue = Number(offer)
            if (promo && !offerValue) return toast.push('Escribe el total de la promo')
            addShopping({
              name,
              category: addCategory,
              quantity: count,
              price: promo ? 0 : Number(price) || 0,
              offerTotal: promo ? offerValue : null,
              createdAt: stampOnDate(itemDate),
            })
            setMonth(monthKey(itemDate))
            setName('')
            setPrice('')
            setOffer('')
            setQty('1')
            setPromo(false)
            setOpen(false)
            toast.push(promo ? 'Promo guardada en ese mes' : 'En la lista de ese mes. Al comprarlo el gasto queda ahí')
          }}
        />
      </Sheet>
    </Screen>
  )
}
