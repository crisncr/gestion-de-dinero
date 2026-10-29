import { Check, Search } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { GlowPanel } from '../../src/GlowPanel'
import { Screen } from '../../src/Screen'
import { categoryLabel, shoppingCategories } from '../../src/data/catalog'
import { money, shoppingLineTotal } from '../../src/lib/format'
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
  const { household, state, stats, addShopping, toggleShopping, removeShopping, clearPurchased, closeOrder, refresh } =
    useStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [name, setName] = useState('')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [qty, setQty] = useState('1')
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')
  const [delivery, setDelivery] = useState('')
  const [orderCoupon, setOrderCoupon] = useState('')
  const currency = household?.currency ?? 'CLP'
  const addCategory = filter === 'all' ? 'mercado' : filter

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.shopping
      .filter((s) => s.householdId === household?.id)
      .filter((s) => (filter === 'all' ? true : s.category === filter))
      .filter((s) => (q ? s.name.toLowerCase().includes(q) : true))
      .sort((a, b) => Number(a.purchased) - Number(b.purchased))
  }, [filter, household?.id, query, state.shopping])

  const pendingInView = items.filter((item) => !item.purchased)
  const pendingTotal = pendingInView.reduce(
    (sum, item) => sum + shoppingLineTotal(item.price, item.quantity, item.discount ?? 0),
    0,
  )
  const orderPay = Math.max(0, pendingTotal + (Number(delivery) || 0) - (Number(orderCoupon) || 0))
  const filterLabel = filter === 'all' ? 'todos' : categoryLabel(filter, shoppingCategories).toLowerCase()

  return (
    <Screen onRefresh={refresh}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: colors.mint, fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.6 }}>LISTA</Text>
          <Text style={{ color: colors.cream, fontSize: 30, fontFamily: fonts.extra, marginTop: 4 }}>Compras</Text>
          <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 4 }}>
            {household?.name ?? 'Tu hogar'} · {pendingInView.length} pendiente{pendingInView.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Button title="+ Producto" size="sm" onPress={() => setOpen(true)} />
      </View>

      <GlowPanel>
        <Text style={{ color: 'rgba(85,214,160,0.8)', fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.4 }}>
          PENDIENTE EN LISTA
        </Text>
        <Text style={{ color: colors.cream, fontSize: 36, fontFamily: fonts.extra, marginTop: 10, letterSpacing: -0.8 }}>
          {money(pendingTotal, currency)}
        </Text>
        <Text style={{ color: colors.mute, marginTop: 8, fontFamily: fonts.regular, lineHeight: 18 }}>
          {pendingInView.length} de {filterLabel} · el cupón ya está restado del total
        </Text>
        <View style={{ marginTop: 14 }}>
          <Progress value={stats.monthIncome > 0 ? (stats.shoppingTotal / stats.monthIncome) * 100 : 0} />
        </View>
      </GlowPanel>

      <Field label="Buscar" icon={Search} placeholder="Leche, arena, jabón..." value={query} onChangeText={setQuery} />
      {pendingInView.length > 0 ? (
        <Button title="Cerrar pedido" variant="secondary" onPress={() => setOrderOpen(true)} />
      ) : null}

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
            title={query ? 'Nada coincide' : filter === 'all' ? 'Lista vacía' : `Sin productos de ${filterLabel}`}
            text={filter === 'all' ? 'Agrega productos para el supermercado.' : `Agrega otro producto de ${filterLabel}.`}
          />
        ) : (
          items.map((item, index) => {
            const accent = shopAccent[item.category] ?? colors.mint
            const gross = item.price * item.quantity
            const net = shoppingLineTotal(item.price, item.quantity, item.discount ?? 0)
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
                    {categoryLabel(item.category, shoppingCategories)} · ×{item.quantity}
                    {(item.discount ?? 0) > 0 ? ` · cupón ${money(item.discount ?? 0, currency)}` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: item.purchased ? colors.mute : colors.cream, fontFamily: fonts.bold }}>
                    {money(net, currency)}
                  </Text>
                  {(item.discount ?? 0) > 0 ? (
                    <Text
                      style={{
                        color: colors.mute,
                        fontSize: 11,
                        fontFamily: fonts.regular,
                        textDecorationLine: 'line-through',
                      }}
                    >
                      {money(gross, currency)}
                    </Text>
                  ) : null}
                </View>
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
        <Button title="Quitar productos comprados" variant="secondary" onPress={clearPurchased} />
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
        <Field label="Cantidad" keyboardType="numeric" value={qty} onChangeText={setQty} />
        <Field label={`Precio (${currency})`} keyboardType="numeric" value={price} onChangeText={setPrice} />
        <Field
          label={`Cupón del producto (${currency})`}
          keyboardType="numeric"
          placeholder="0"
          value={discount}
          onChangeText={setDiscount}
        />
        <Button
          title="Guardar"
          onPress={() => {
            if (name.trim().length < 2) return toast.push('Escribe el producto')
            addShopping({
              name,
              category: addCategory,
              quantity: Number(qty) || 1,
              price: Number(price) || 0,
              discount: Number(discount) || 0,
            })
            setName('')
            setPrice('')
            setDiscount('')
            setOpen(false)
            toast.push('En la lista. Al comprarlo se suma lo que pagas')
          }}
        />
      </Sheet>
      <Sheet
        open={orderOpen}
        title="Cerrar pedido"
        subtitle="Marca los pendientes de esta lista como comprados. El envío y el cupón del pedido se aplican una sola vez."
        onClose={() => setOrderOpen(false)}
      >
        <Field
          label={`Envío Uber Eats (${currency})`}
          keyboardType="numeric"
          placeholder="0"
          value={delivery}
          onChangeText={setDelivery}
        />
        <Field
          label={`Cupón del pedido (${currency})`}
          keyboardType="numeric"
          placeholder="0"
          value={orderCoupon}
          onChangeText={setOrderCoupon}
        />
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, lineHeight: 18 }}>
          Vas a registrar {money(orderPay, currency)} en los gastos.
        </Text>
        <Button
          title="Registrar pedido"
          onPress={() => {
            closeOrder({
              itemIds: pendingInView.map((item) => item.id),
              delivery: Number(delivery) || 0,
              orderCoupon: Number(orderCoupon) || 0,
            })
            setDelivery('')
            setOrderCoupon('')
            setOrderOpen(false)
            toast.push('Pedido cerrado. El gasto usa lo que pagaste')
          }}
        />
      </Sheet>
    </Screen>
  )
}
