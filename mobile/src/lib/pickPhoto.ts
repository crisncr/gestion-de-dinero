import * as ImageManipulator from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'

export async function pickProfilePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) {
    throw new Error('Necesitamos permiso para usar tus fotos')
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  })
  if (picked.canceled || !picked.assets[0]?.uri) return null

  const edited = await ImageManipulator.manipulateAsync(
    picked.assets[0].uri,
    [{ resize: { width: 640 } }],
    { compress: 0.52, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  )
  if (!edited.base64) throw new Error('No se pudo leer la foto')
  return `data:image/jpeg;base64,${edited.base64}`
}
