import type { LucideIcon } from 'lucide-react-native'
import { ChevronRight, Eye, EyeOff } from 'lucide-react-native'
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type TextInputProps,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { initials } from './lib/format'
import { colors, fonts, radius } from './theme'

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.kicker}>{children}</Text>
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  size = 'md',
}: {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        size === 'sm' && styles.btnSm,
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'danger' && styles.btnDanger,
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text
        style={[
          styles.btnText,
          variant === 'primary' && { color: colors.ink },
          variant === 'danger' && { color: colors.danger },
          { fontFamily: fonts.bold },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  )
}

export function Field({
  label,
  error,
  icon: Icon,
  password,
  onFocus,
  onBlur,
  secureTextEntry,
  ...props
}: TextInputProps & { label: string; error?: string; icon?: LucideIcon; password?: boolean }) {
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(true)
  const box = useRef<View>(null)
  const sheetScroll = useSheetScroll()

  return (
    <View ref={box} style={{ gap: 8 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          focused && styles.inputWrapFocus,
          error ? styles.inputWrapError : null,
        ]}
      >
        {Icon ? <Icon size={18} color={focused ? colors.mint : colors.mute} /> : null}
        <TextInput
          placeholderTextColor="#6F6F6F"
          style={styles.input}
          secureTextEntry={password ? hidden : secureTextEntry}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
            sheetScroll?.reveal(box.current)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          {...props}
        />
        {password ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={10}>
            {hidden ? <EyeOff size={18} color={colors.mute} /> : <Eye size={18} color={colors.mute} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const fontSize = size >= 64 ? 24 : size >= 48 ? 16 : 13
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize, fontFamily: fonts.bold }]}>{initials(name) || 'H'}</Text>
    </View>
  )
}

export function IconCircle({
  icon: Icon,
  color = colors.cream,
  background = colors.lift,
  size = 52,
}: {
  icon: LucideIcon
  color?: string
  background?: string
  size?: number
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={Math.round(size * 0.38)} color={color} />
    </View>
  )
}

export function SettingRow({
  label,
  value,
  onPress,
  last,
}: {
  label: string
  value?: string
  onPress?: () => void
  last?: boolean
}) {
  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
        gap: 12,
      }}
    >
      <Text style={{ color: colors.mute, fontFamily: fonts.regular, flex: 1 }}>{label}</Text>
      <Text
        style={{ color: colors.cream, fontFamily: fonts.semibold, maxWidth: '58%', textAlign: 'right' }}
        numberOfLines={1}
      >
        {value || '—'}
      </Text>
      {onPress ? <ChevronRight size={16} color={colors.mute} /> : null}
    </View>
  )
  if (!onPress) return inner
  return <Pressable onPress={onPress}>{inner}</Pressable>
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string
  active?: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && { color: colors.mint }]}>{label}</Text>
    </Pressable>
  )
}

export function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  const tone = pct >= 100 ? colors.danger : pct >= 80 ? colors.warn : colors.mint
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: tone }]} />
    </View>
  )
}

type SheetScrollApi = { reveal: (view: View | null) => void }
const SheetScrollContext = createContext<SheetScrollApi | null>(null)

export function useSheetScroll() {
  return useContext(SheetScrollContext)
}

export function Sheet({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}) {
  const { height: windowHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const offsetRef = useRef(0)
  const keyboardRef = useRef(0)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    if (!open) {
      keyboardRef.current = 0
      setKeyboardHeight(0)
      return
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const show = Keyboard.addListener(showEvent, (event) => {
      keyboardRef.current = event.endCoordinates.height
      setKeyboardHeight(event.endCoordinates.height)
    })
    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardRef.current = 0
      setKeyboardHeight(0)
    })
    return () => {
      show.remove()
      hide.remove()
    }
  }, [open])

  const reveal = useMemo<SheetScrollApi['reveal']>(
    () => (view) => {
      if (!view || !scrollRef.current) return
      setTimeout(() => {
        scrollRef.current?.measureInWindow((_sx, sy, _sw, sh) => {
          view.measureInWindow((_x, y, _width, height) => {
            const targetTop = sy + sh - height - 8
            const delta = y - targetTop
            if (Math.abs(delta) < 8) return
            scrollRef.current?.scrollTo({
              y: Math.max(0, offsetRef.current + delta),
              animated: true,
            })
          })
        })
      }, Platform.OS === 'ios' ? 280 : 140)
    },
    [],
  )

  const bottomGap = keyboardHeight > 0 ? keyboardHeight : Math.max(insets.bottom, 12)
  const available = windowHeight - bottomGap - insets.top - 8
  const sheetMax = keyboardHeight > 0 ? Math.min(available, 300) : Math.min(available, windowHeight * 0.88)

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: bottomGap }}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { maxHeight: sheetMax }]}>
          <View style={styles.sheetGrab} />
          <View style={styles.sheetHead}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={{ color: colors.mint, fontFamily: fonts.semibold }}>Listo</Text>
            </Pressable>
          </View>
          <SheetScrollContext.Provider value={{ reveal }}>
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              onScroll={(event) => {
                offsetRef.current = event.nativeEvent.contentOffset.y
              }}
              scrollEventThrottle={16}
              style={{ maxHeight: Math.max(120, sheetMax - 96) }}
            >
              <View style={{ gap: 16, paddingBottom: 12 }}>{children}</View>
            </ScrollView>
          </SheetScrollContext.Provider>
        </View>
      </View>
    </Modal>
  )
}

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <View style={{ paddingVertical: 28, alignItems: 'center' }}>
      <Text style={{ color: colors.cream, fontWeight: '600', fontSize: 15 }}>{title}</Text>
      <Text style={{ color: colors.mute, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>{text}</Text>
    </View>
  )
}

type ToastApi = { push: (message: string) => void }
const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const api = useMemo(
    () => ({
      push: (next: string) => {
        setMessage(next)
        setTimeout(() => setMessage(null), 2400)
      },
    }),
    [],
  )
  return (
    <ToastContext.Provider value={api}>
      {children}
      {message ? (
        <View style={styles.toast}>
          <Text style={{ color: colors.cream }}>{message}</Text>
        </View>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('Toast')
  return ctx
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 18,
  },
  kicker: {
    color: colors.mute,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  btn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnSm: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  btnPrimary: { backgroundColor: colors.mint },
  btnSecondary: { backgroundColor: colors.lift, borderWidth: 1, borderColor: colors.line },
  btnDanger: { backgroundColor: 'rgba(199,91,91,0.16)' },
  btnText: { color: colors.cream, fontSize: 15, fontFamily: fonts.bold },
  fieldLabel: { color: colors.mute, fontSize: 13, fontFamily: fonts.semibold },
  inputWrap: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.lift,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapFocus: {
    borderColor: 'rgba(85,214,160,0.55)',
    backgroundColor: '#1A1A1A',
  },
  inputWrapError: { borderColor: 'rgba(199,91,91,0.7)' },
  input: {
    flex: 1,
    color: colors.cream,
    fontSize: 16,
    paddingVertical: 14,
    fontFamily: fonts.regular,
  },
  error: { color: colors.danger, fontSize: 12, fontFamily: fonts.regular },
  avatar: {
    backgroundColor: colors.lift,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.mint, fontWeight: '700', fontSize: 13 },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.lift,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: 'rgba(85,214,160,0.12)', borderColor: 'rgba(85,214,160,0.4)' },
  chipText: { color: colors.mute, fontSize: 13, fontWeight: '500' },
  track: { height: 6, borderRadius: 99, backgroundColor: colors.lift, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 99 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 22,
    gap: 16,
  },
  sheetGrab: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.line,
    marginBottom: 8,
  },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sheetTitle: { color: colors.cream, fontSize: 22, fontFamily: fonts.extra },
  sheetSubtitle: { color: colors.mute, fontSize: 13, fontFamily: fonts.regular, marginTop: 6, lineHeight: 18 },
  toast: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
})
