import { useRouter } from 'expo-router'
import { Check, PawPrint } from 'lucide-react-native'
import { useMemo, useRef, useState } from 'react'
import { Alert, Image, Pressable, Text, View } from 'react-native'
import { BackHeader } from '../../src/BackHeader'
import { PetSupplySheet } from '../../src/PetSupplySheet'
import { Screen } from '../../src/Screen'
import { VaccineSheet } from '../../src/VaccineSheet'
import { petSpecies, speciesPack, speciesPacks } from '../../src/data/catalog'
import { pickProfilePhoto } from '../../src/lib/pickPhoto'
import { caresForPet, joinPetNames, latestCare, petColor, supplyStatus, toneColor, vaccineStatus } from '../../src/lib/pets'
import { useStore } from '../../src/store/StoreProvider'
import { colors, fonts } from '../../src/theme'
import { Button, Card, Chip, Empty, Field, Sheet, useToast } from '../../src/ui'

type ActionKind = 'comida' | 'arena' | 'vacuna'

export default function PetsScreen() {
  const { household, state, addPet, removePets } = useStore()
  const router = useRouter()
  const toast = useToast()
  const pets = state.pets.filter((p) => p.householdId === household?.id)
  const currency = household?.currency ?? 'CLP'
  const [pack, setPack] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<{ petId: string; kind: ActionKind } | null>(null)
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('Gato')
  const [weight, setWeight] = useState('0')
  const [photo, setPhoto] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const savingRef = useRef(false)
  const target = pets.find((pet) => pet.id === action?.petId) ?? null
  const targetCares = target ? caresForPet(state.petCares, target.id) : []
  const visible = pack ? pets.filter((pet) => pet.species === pack) : []
  const currentPack = pack ? speciesPack(pack) : null
  const scope = pack ? visible : pets

  const packs = useMemo(
    () =>
      speciesPacks
        .map((item) => {
          const group = pets.filter((pet) => pet.species === item.id)
          return { ...item, group, cover: group.find((pet) => pet.photo)?.photo ?? null }
        })
        .filter((item) => item.group.length > 0),
    [pets],
  )

  return (
    <Screen>
      <BackHeader
        title={selecting ? (selected.length ? `${selected.length} elegidas` : 'Elegir') : currentPack ? currentPack.title : 'Mascotas'}
        onBack={
          selecting
            ? () => {
                setSelecting(false)
                setSelected([])
              }
            : pack
              ? () => setPack(null)
              : undefined
        }
        action={
          selecting ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                title="Todas"
                size="sm"
                variant="secondary"
                onPress={() => setSelected(scope.map((pet) => pet.id))}
              />
              <Button
                title={selected.length ? `Borrar ${selected.length}` : 'Borrar'}
                size="sm"
                variant="danger"
                disabled={!selected.length}
                onPress={() => {
                  const ids = [...selected]
                  Alert.alert(
                    ids.length === 1 ? 'Eliminar mascota' : 'Eliminar mascotas',
                    ids.length === pets.length
                      ? 'Se van a eliminar todas las mascotas de este hogar.'
                      : `Se van a eliminar ${ids.length} mascotas.`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => {
                          removePets(ids)
                          setSelecting(false)
                          setSelected([])
                          if (pack && visible.every((pet) => ids.includes(pet.id))) setPack(null)
                          toast.push(ids.length === 1 ? 'Mascota eliminada' : `${ids.length} mascotas eliminadas`)
                        },
                      },
                    ],
                  )
                }}
              />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {pets.length > 0 ? (
                <Button
                  title="Elegir"
                  size="sm"
                  variant="secondary"
                  onPress={() => {
                    setSelecting(true)
                    setSelected([])
                  }}
                />
              ) : null}
              <Button
                title="Agregar"
                size="sm"
                onPress={() => {
                  savingRef.current = false
                  setName('')
                  setWeight('0')
                  setPhoto(null)
                  setSpecies(pack ?? 'Gato')
                  setOpen(true)
                }}
              />
            </View>
          )
        }
      />
      {!pack && pets.length > 0 ? (
        <Text style={{ color: colors.mute, fontFamily: fonts.regular }}>
          {selecting
            ? 'Marca una manada o Todas, y luego Borrar.'
            : 'Entra a una manada para ver a todos los de esa especie.'}
        </Text>
      ) : null}

      {pets.length === 0 ? (
        <Card>
          <Empty title="Sin mascotas" text="Agrega la primera y luego se juntan solas: perros con perros, gatos con gatos." />
        </Card>
      ) : !pack ? (
        packs.map((item) => {
          const accent = petColor(item.id)
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                const ids = item.group.map((pet) => pet.id)
                if (selecting) {
                  const allOn = ids.every((id) => selected.includes(id))
                  setSelected(allOn ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])])
                  return
                }
                setPack(item.id)
              }}
            >
              <View style={{ backgroundColor: colors.card, borderRadius: 28, overflow: 'hidden' }}>
                <View style={{ aspectRatio: 1, backgroundColor: `${accent}22` }}>
                  {selecting ? <SelectMark on={item.group.every((pet) => selected.includes(pet.id))} /> : null}
                  {item.cover ? (
                    <Image source={{ uri: item.cover }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <PawPrint size={46} color={accent} />
                    </View>
                  )}
                  <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.55)' }}>
                    <Text style={{ color: colors.mint, fontFamily: fonts.semibold, fontSize: 12 }}>{item.pack}</Text>
                    <Text style={{ color: colors.cream, fontFamily: fonts.extra, fontSize: 26, marginTop: 2 }}>{item.title}</Text>
                    <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 4 }}>
                      {item.group.length} {item.group.length === 1 ? 'mascota' : 'mascotas'} · {item.group.map((pet) => pet.name).join(', ')}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )
        })
      ) : (
        <>
          {visible.map((pet) => {
            const cares = caresForPet(state.petCares, pet.id)
            const lastFood = latestCare(cares, 'comida')
            const lastLitter = latestCare(cares, 'arena')
            const lastVaccine = latestCare(cares, 'vacuna')
            const vaccine = vaccineStatus(pet.nextVaccine)
            const food = supplyStatus(lastFood, 'Sin comida')
            const litter = supplyStatus(lastLitter, 'Sin arena')
            const accent = petColor(pet.species)
            const shared = lastFood && lastFood.petIds?.length > 1 ? joinPetNames(pets, lastFood.petIds) : ''
            return (
              <View key={pet.id} style={{ backgroundColor: colors.card, borderRadius: 28, overflow: 'hidden' }}>
                <Pressable
                  onPress={() => {
                    if (selecting) {
                      setSelected((current) =>
                        current.includes(pet.id) ? current.filter((id) => id !== pet.id) : [...current, pet.id],
                      )
                      return
                    }
                    router.push(`/mascotas/${pet.id}`)
                  }}
                >
                  <View style={{ aspectRatio: 1, backgroundColor: `${accent}22` }}>
                    {selecting ? <SelectMark on={selected.includes(pet.id)} /> : null}
                    {pet.photo ? (
                      <Image source={{ uri: pet.photo }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <PawPrint size={42} color={accent} />
                      </View>
                    )}
                    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.55)' }}>
                      <Text style={{ color: colors.cream, fontFamily: fonts.extra, fontSize: 22 }}>{pet.name}</Text>
                      <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 2 }}>
                        {pet.weight ? `${pet.weight} kg` : 'Sin peso'}
                        {shared ? ` · con ${shared}` : ''}
                      </Text>
                    </View>
                  </View>
                </Pressable>
                {selecting ? null : (
                <View style={{ padding: 14, gap: 12 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <Badge label={vaccine.label} color={toneColor(vaccine.tone)} />
                    <Badge label={food.label} color={toneColor(food.tone)} />
                    {pet.species === 'Gato' || lastLitter ? <Badge label={litter.label} color={toneColor(litter.tone)} /> : null}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <MiniAction
                      label={lastVaccine || pet.nextVaccine ? 'Editar vacuna' : 'Vacuna'}
                      onPress={() => setAction({ petId: pet.id, kind: 'vacuna' })}
                    />
                    <MiniAction
                      label={lastFood ? 'Editar comida' : 'Comprar comida'}
                      onPress={() => setAction({ petId: pet.id, kind: 'comida' })}
                    />
                    <MiniAction
                      label={lastLitter ? 'Editar arena' : 'Comprar arena'}
                      onPress={() => setAction({ petId: pet.id, kind: 'arena' })}
                    />
                  </View>
                </View>
                )}
              </View>
            )
          })}
        </>
      )}

      <Sheet
        open={open}
        title="Nueva mascota"
        subtitle="Elige la especie. Luego vive en su manada: perros con perros, gatos con gatos."
        onClose={() => setOpen(false)}
      >
        <Field label="Nombre" placeholder="Luna, Milo..." value={name} onChangeText={setName} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {petSpecies.map((item) => (
            <Chip key={item} label={item} active={species === item} onPress={() => setSpecies(item)} />
          ))}
        </View>
        <Field label="Peso (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} />
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: 140, height: 140, borderRadius: 70, alignSelf: 'center' }} />
        ) : null}
        <Button
          title={photo ? 'Ajustar foto' : 'Elegir y recortar foto'}
          variant="secondary"
          onPress={async () => {
            try {
              const next = await pickProfilePhoto()
              if (next) setPhoto(next)
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'No se pudo abrir la foto')
            }
          }}
        />
        <Button
          title="Guardar"
          onPress={() => {
            if (savingRef.current) return
            if (name.trim().length < 2) return toast.push('Escribe el nombre')
            savingRef.current = true
            try {
              const created = addPet({
                name,
                species,
                weight: Number(weight) || 0,
                photo,
                nextVaccine: null,
                notes: '',
              })
              const packSpecies = species
              setName('')
              setWeight('0')
              setPhoto(null)
              setOpen(false)
              setPack(packSpecies)
              if (created.inherited.length) {
                const extra = created.inherited.map((item) => (item === 'arena' ? 'arena' : 'comida')).join(' y ')
                toast.push(`Se le asignó la ${extra} de los otros ${packSpecies.toLowerCase()}s`)
              } else {
                toast.push('Mascota agregada')
              }
              void created.synced.catch((error) => {
                toast.push(error instanceof Error ? error.message : 'No se pudo guardar la mascota')
              })
            } catch (error) {
              savingRef.current = false
              toast.push(error instanceof Error ? error.message : 'No se pudo guardar la mascota')
            }
          }}
        />
      </Sheet>
      <PetSupplySheet
        open={action?.kind === 'comida' || action?.kind === 'arena'}
        kind={(action?.kind === 'arena' ? 'arena' : 'comida') as 'comida' | 'arena'}
        pets={pets}
        focusPetId={action?.petId}
        care={action?.kind === 'arena' ? latestCare(targetCares, 'arena') : latestCare(targetCares, 'comida')}
        currency={currency}
        onClose={() => setAction(null)}
      />
      <VaccineSheet open={action?.kind === 'vacuna'} pet={target} currency={currency} onClose={() => setAction(null)} />
    </Screen>
  )
}

function SelectMark({ on }: { on: boolean }) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: on ? colors.mint : colors.cream,
        backgroundColor: on ? colors.mint : 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on ? <Check size={16} color={colors.ink} /> : null}
    </View>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: colors.lift, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ color, fontSize: 11, fontFamily: fonts.semibold }}>{label}</Text>
    </View>
  )
}

function MiniAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 40,
        borderRadius: 14,
        backgroundColor: colors.lift,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
      }}
    >
      <Text style={{ color: colors.cream, fontFamily: fonts.semibold, fontSize: 11, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  )
}
