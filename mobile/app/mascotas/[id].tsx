import { useLocalSearchParams, useRouter } from 'expo-router'
import { Bone, CalendarPlus, PawPrint, Syringe } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { BackHeader } from '../../src/BackHeader'
import { PetSupplySheet } from '../../src/PetSupplySheet'
import { Screen } from '../../src/Screen'
import { VaccineSheet } from '../../src/VaccineSheet'
import { careKinds } from '../../src/data/catalog'
import { DatePickerField, datePresets } from '../../src/DatePickerField'
import { money, monthKey, monthTitle, shortDate, todayISO } from '../../src/lib/format'
import { pickProfilePhoto } from '../../src/lib/pickPhoto'
import {
  caresForPet,
  joinPetNames,
  latestCare,
  petColor,
  petIdsOf,
  supplyStatus,
  toneColor,
  vaccineStatus,
} from '../../src/lib/pets'
import { useStore } from '../../src/store/StoreProvider'
import { colors, fonts } from '../../src/theme'
import type { PetCare, PetCareKind } from '../../src/types'
import { Button, Card, Chip, Field, Sheet, useToast } from '../../src/ui'

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const { household, state, addPetWeight, addPetCare, updatePet, removePet, resolvePetId } = useStore()
  const pets = state.pets.filter((p) => p.householdId === household?.id)
  const realId = id ? resolvePetId(id) : ''
  const pet = pets.find((p) => p.id === id || p.id === realId)
  const liveId = pet?.id ?? realId
  const currency = household?.currency ?? 'CLP'
  const weights = useMemo(
    () =>
      state.petWeights
        .filter((w) => w.petId === liveId || w.petId === id)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [id, liveId, state.petWeights],
  )
  const cares = [
    ...caresForPet(state.petCares, liveId),
    ...(id && id !== liveId ? caresForPet(state.petCares, id) : []),
  ].filter((item, index, list) => list.findIndex((row) => row.id === item.id) === index)
  const vaccines = cares.filter((c) => c.kind === 'vacuna')
  const foods = cares.filter((c) => c.kind === 'comida')
  const litters = cares.filter((c) => c.kind === 'arena')
  const others = cares.filter((c) => c.kind !== 'vacuna' && c.kind !== 'comida' && c.kind !== 'arena')
  const [nameOpen, setNameOpen] = useState(false)
  const [name, setName] = useState('')
  const [wOpen, setWOpen] = useState(false)
  const [vOpen, setVOpen] = useState(false)
  const [foodOpen, setFoodOpen] = useState(false)
  const [litterOpen, setLitterOpen] = useState(false)
  const [cOpen, setCOpen] = useState(false)
  const [weight, setWeight] = useState('')
  const [kind, setKind] = useState<PetCareKind>('paseo')
  const [note, setNote] = useState('')
  const [otherPrice, setOtherPrice] = useState('')
  const [otherDate, setOtherDate] = useState(todayISO())

  if (!pet) {
    return (
      <Screen>
        <BackHeader title="Mascota" />
        <Text style={{ color: colors.mute, fontFamily: fonts.regular }}>Esta mascota no existe o no pertenece a tu hogar.</Text>
      </Screen>
    )
  }

  const currentWeight = pet.weight || weights[weights.length - 1]?.weight || 0
  const max = Math.max(...weights.map((w) => w.weight), currentWeight, 1)
  const accent = petColor(pet.species)
  const vaccine = vaccineStatus(pet.nextVaccine)
  const lastFood = latestCare(cares, 'comida')
  const lastLitter = latestCare(cares, 'arena')
  const lastVaccine = latestCare(cares, 'vacuna')
  const food = supplyStatus(lastFood, 'Aún no compras comida')
  const litter = supplyStatus(lastLitter, 'Aún no compras arena')

  return (
    <Screen>
      <BackHeader title={pet.name} />
      <View style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: colors.card }}>
        <View style={{ aspectRatio: 1, backgroundColor: `${accent}22` }}>
          {pet.photo ? (
            <Image source={{ uri: pet.photo }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <PawPrint size={52} color={accent} />
            </View>
          )}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <Text style={{ color: colors.cream, fontFamily: fonts.extra, fontSize: 26 }}>{pet.name}</Text>
            <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 4 }}>
              {pet.species}
              {currentWeight ? ` · ${currentWeight} kg` : ' · Sin peso'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
        <Pressable
          onPress={() => {
            setName(pet.name)
            setNameOpen(true)
          }}
          style={{ flex: 1, padding: 14 }}
        >
          <Text style={{ color: colors.mint, fontFamily: fonts.semibold, textAlign: 'center' }}>Editar nombre</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            try {
              const next = await pickProfilePhoto()
              if (!next) return
              await updatePet(pet.id, {
                name: pet.name,
                species: pet.species,
                weight: pet.weight,
                photo: next,
                nextVaccine: pet.nextVaccine,
                notes: pet.notes,
              })
              toast.push('Foto actualizada')
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'No se pudo guardar la foto')
            }
          }}
          style={{ flex: 1, padding: 14 }}
        >
          <Text style={{ color: colors.mint, fontFamily: fonts.semibold, textAlign: 'center' }}>Ajustar foto</Text>
        </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
        <Action label={lastVaccine || pet.nextVaccine ? 'Editar vacuna' : 'Vacuna'} icon={Syringe} color="#E06A6A" onPress={() => setVOpen(true)} />
        <Action label={lastFood ? 'Editar comida' : 'Comprar comida'} icon={Bone} color="#55D6A0" onPress={() => setFoodOpen(true)} />
        <Action label={lastLitter ? 'Editar arena' : 'Comprar arena'} icon={CalendarPlus} color="#A78BFA" onPress={() => setLitterOpen(true)} />
      </View>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.cream, fontFamily: fonts.bold }}>Vacunas</Text>
          <Button title={lastVaccine ? 'Editar' : 'Registrar'} size="sm" onPress={() => setVOpen(true)} />
        </View>
        <Text style={{ color: toneColor(vaccine.tone), fontFamily: fonts.semibold, marginTop: 10 }}>{vaccine.label}</Text>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 4 }}>{vaccine.detail}</Text>
        {vaccines.length === 0 ? (
          <Text style={{ color: colors.mute, marginTop: 12, fontFamily: fonts.regular }}>
            Aquí verás cada vacuna aplicada y la fecha de la siguiente dosis.
          </Text>
        ) : (
          vaccines.map((item) => <CareRow key={item.id} item={item} pets={pets} currency={currency} />)
        )}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.cream, fontFamily: fonts.bold }}>Comida</Text>
          <Button title={lastFood ? 'Editar' : 'Comprar'} size="sm" onPress={() => setFoodOpen(true)} />
        </View>
        <Text style={{ color: toneColor(food.tone), fontFamily: fonts.semibold, marginTop: 10 }}>{food.label}</Text>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 4 }}>{food.detail}</Text>
        {foods.length === 0 ? (
          <Text style={{ color: colors.mute, marginTop: 12, fontFamily: fonts.regular }}>
            Un saco puede ser para varios gatos. Elige a quiénes les aplica y el gasto entra una sola vez.
          </Text>
        ) : (
          foods.slice(0, 5).map((item) => <CareRow key={item.id} item={item} pets={pets} currency={currency} />)
        )}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.cream, fontFamily: fonts.bold }}>
            {pet.species === 'Gato' ? 'Arena de gato' : 'Arena / higiene'}
          </Text>
          <Button title={lastLitter ? 'Editar' : 'Comprar'} size="sm" onPress={() => setLitterOpen(true)} />
        </View>
        <Text style={{ color: toneColor(litter.tone), fontFamily: fonts.semibold, marginTop: 10 }}>{litter.label}</Text>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 4 }}>{litter.detail}</Text>
        {litters.length === 0 ? (
          <Text style={{ color: colors.mute, marginTop: 12, fontFamily: fonts.regular }}>
            Si compras un saco para todos los gatos, márcalos y se verá en cada ficha.
          </Text>
        ) : (
          litters.slice(0, 5).map((item) => <CareRow key={item.id} item={item} pets={pets} currency={currency} />)
        )}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: colors.cream, fontFamily: fonts.bold }}>Peso</Text>
          <Button
            title="Actualizar"
            size="sm"
            variant="secondary"
            onPress={() => {
              setWeight(currentWeight ? String(currentWeight) : '')
              setWOpen(true)
            }}
          />
        </View>
        <Text style={{ color: colors.cream, fontFamily: fonts.extra, fontSize: 28 }}>
          {currentWeight ? `${currentWeight} kg` : 'Sin peso'}
        </Text>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 4, marginBottom: 8 }}>
          {weights.length > 0 ? `Último registro ${shortDate(weights[weights.length - 1].date)}` : 'El peso con el que la creaste aparece aquí.'}
        </Text>
        {weights.length < 2 ? null : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {weights.map((w) => (
              <View key={w.id} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <View style={{ width: '100%', height: (w.weight / max) * 90, backgroundColor: colors.mint, borderRadius: 8 }} />
                <Text style={{ color: colors.mute, fontSize: 10, fontFamily: fonts.regular }}>{shortDate(w.date)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.cream, fontFamily: fonts.bold }}>Otros cuidados</Text>
          <Button title="Agregar" size="sm" variant="secondary" onPress={() => setCOpen(true)} />
        </View>
        {others.length === 0 ? (
          <Text style={{ color: colors.mute, marginTop: 10, fontFamily: fonts.regular }}>Paseos, veterinario o medicina.</Text>
        ) : (
          others.map((item) => <CareRow key={item.id} item={item} pets={pets} currency={currency} />)
        )}
      </Card>

      <Button
        title="Eliminar mascota"
        variant="danger"
        onPress={() => {
          removePet(pet.id)
          toast.push('Mascota eliminada')
          router.back()
        }}
      />

      <VaccineSheet open={vOpen} pet={pet} currency={currency} onClose={() => setVOpen(false)} />
      <PetSupplySheet
        open={foodOpen}
        kind="comida"
        pets={pets}
        focusPetId={pet.id}
        care={lastFood}
        currency={currency}
        onClose={() => setFoodOpen(false)}
      />
      <PetSupplySheet
        open={litterOpen}
        kind="arena"
        pets={pets}
        focusPetId={pet.id}
        care={lastLitter}
        currency={currency}
        onClose={() => setLitterOpen(false)}
      />

      <Sheet open={nameOpen} title="Editar nombre" onClose={() => setNameOpen(false)}>
        <Field label="Nombre" value={name} onChangeText={setName} />
        <Button
          title="Guardar"
          onPress={() => {
            const nextName = name.trim()
            if (nextName.length < 2) return toast.push('Escribe el nombre')
            void updatePet(pet.id, {
              name: nextName,
              species: pet.species,
              weight: pet.weight,
              photo: pet.photo,
              nextVaccine: pet.nextVaccine,
              notes: pet.notes,
            })
            setNameOpen(false)
            toast.push('Nombre actualizado')
          }}
        />
      </Sheet>

      <Sheet open={wOpen} title="Actualizar peso" subtitle={currentWeight ? `Peso anterior: ${currentWeight} kg` : undefined} onClose={() => setWOpen(false)}>
        <Field label="Peso (kg)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
        <Button
          title="Guardar"
          onPress={() => {
            const value = Number(weight.replace(',', '.'))
            if (!value || value <= 0) return toast.push('Peso inválido')
            addPetWeight(pet.id, value, todayISO())
            setWeight('')
            setWOpen(false)
            toast.push('Peso actualizado')
          }}
        />
      </Sheet>

      <Sheet open={cOpen} title="Otro cuidado" onClose={() => setCOpen(false)}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {careKinds
            .filter((item) => item.id !== 'vacuna' && item.id !== 'comida' && item.id !== 'arena')
            .map((item) => (
              <Chip key={item.id} label={item.label} active={kind === item.id} onPress={() => setKind(item.id)} />
            ))}
        </View>
        <Field label="Nota" value={note} onChangeText={setNote} />
        <Field label={`Costo (${currency}), si hubo compra`} keyboardType="numeric" value={otherPrice} onChangeText={setOtherPrice} />
        <DatePickerField label="Fecha" value={otherDate} onChange={setOtherDate} presets={datePresets('event')} />
        <Button
          title="Guardar"
          onPress={() => {
            const amount = Number(otherPrice)
            addPetCare(pet.id, {
              kind,
              note,
              date: otherDate || todayISO(),
              amount: amount > 0 ? amount : null,
              petIds: [pet.id],
            })
            setNote('')
            setOtherPrice('')
            setOtherDate(todayISO())
            setCOpen(false)
            toast.push(
              amount > 0
                ? `Gasto de mascota en ${monthTitle(monthKey(otherDate))}`
                : 'Cuidado registrado en esa fecha',
            )
          }}
        />
      </Sheet>
    </Screen>
  )
}

function CareRow({ item, pets, currency }: { item: PetCare; pets: { id: string; name: string }[]; currency: string }) {
  const ids = petIdsOf(item)
  const shared = ids.length > 1 ? `Para ${joinPetNames(pets, ids)}` : ''
  return (
    <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, marginTop: 8 }}>
      <Text style={{ color: colors.cream, fontFamily: fonts.semibold }}>{item.note || item.kind}</Text>
      <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 3 }}>
        {shortDate(item.date)}
        {item.amount ? ` · ${money(item.amount, currency)}` : ''}
        {item.nextDate ? ` · reponer ${shortDate(item.nextDate)}` : ''}
        {shared ? ` · ${shared}` : ''}
      </Text>
    </View>
  )
}

function Action({
  label,
  icon: Icon,
  color,
  onPress,
}: {
  label: string
  icon: typeof Syringe
  color: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 22,
        paddingVertical: 14,
        alignItems: 'center',
        gap: 8,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lift, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </View>
      <Text style={{ color: colors.cream, fontFamily: fonts.semibold, fontSize: 12 }}>{label}</Text>
    </Pressable>
  )
}
