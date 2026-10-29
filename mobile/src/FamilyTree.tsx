import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Svg, { Line } from 'react-native-svg'
import { colors, fonts } from './theme'
import type { Member } from './types'
import { Avatar } from './ui'

const roleLabel = { owner: 'Titular', admin: 'Administrador', member: 'Integrante' } as const

const NODE_W = 96
const NODE_H = 112
const GAP = 18
const TOP = 8
const BRANCH = 46

export function FamilyTree({
  owner,
  members,
  canManage,
  onRemove,
}: {
  owner: Member | null
  members: Member[]
  canManage: boolean
  onRemove: (id: string) => void
}) {
  const [box, setBox] = useState(0)
  const kids = members
  const rowWidth = kids.length > 0 ? kids.length * NODE_W + (kids.length - 1) * GAP : NODE_W
  const canvas = Math.max(box, rowWidth, NODE_W)
  const ownerX = (canvas - NODE_W) / 2
  const ownerCx = ownerX + NODE_W / 2
  const firstCx = kids.length ? NODE_W / 2 : ownerCx
  const lastCx = kids.length ? (kids.length - 1) * (NODE_W + GAP) + NODE_W / 2 : ownerCx
  const trunkTop = TOP + NODE_H
  const railY = trunkTop + BRANCH / 2
  const childTop = trunkTop + BRANCH
  const height = kids.length ? childTop + NODE_H + (canManage ? 22 : 8) : TOP + NODE_H + 56

  return (
    <View onLayout={(event) => setBox(event.nativeEvent.layout.width)} style={{ width: '100%' }}>
      <Text
        style={{
          color: 'rgba(85,214,160,0.8)',
          fontSize: 11,
          fontFamily: fonts.semibold,
          letterSpacing: 1.6,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        ÁRBOL DEL HOGAR
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: box }}>
        <View style={{ width: canvas, height }}>
          {box > 0 ? (
            <Svg width={canvas} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
              {kids.length > 0 ? (
                <>
                  <Line x1={ownerCx} y1={trunkTop} x2={ownerCx} y2={railY} stroke="rgba(85,214,160,0.55)" strokeWidth={2} />
                  <Line x1={firstCx} y1={railY} x2={lastCx} y2={railY} stroke="rgba(85,214,160,0.55)" strokeWidth={2} />
                  {kids.map((_, index) => {
                    const cx = index * (NODE_W + GAP) + NODE_W / 2
                    return (
                      <Line
                        key={`drop-${index}`}
                        x1={cx}
                        y1={railY}
                        x2={cx}
                        y2={childTop}
                        stroke="rgba(85,214,160,0.55)"
                        strokeWidth={2}
                      />
                    )
                  })}
                </>
              ) : (
                <>
                  <Line
                    x1={ownerCx}
                    y1={trunkTop}
                    x2={ownerCx}
                    y2={trunkTop + 28}
                    stroke="rgba(85,214,160,0.35)"
                    strokeWidth={2}
                    strokeDasharray="4 6"
                  />
                </>
              )}
            </Svg>
          ) : null}

          {owner ? (
            <View style={{ position: 'absolute', left: ownerX, top: TOP, width: NODE_W }}>
              <TreeNode member={owner} highlight />
            </View>
          ) : null}

          {kids.map((member, index) => (
            <View
              key={member.id}
              style={{ position: 'absolute', left: index * (NODE_W + GAP), top: childTop, width: NODE_W, alignItems: 'center' }}
            >
              <TreeNode member={member} />
              {canManage ? (
                <Pressable onPress={() => onRemove(member.id)} hitSlop={8}>
                  <Text style={{ color: colors.danger, fontSize: 11, fontFamily: fonts.semibold, marginTop: 4 }}>Quitar</Text>
                </Pressable>
              ) : null}
            </View>
          ))}

          {kids.length === 0 ? (
            <Text
              style={{
                position: 'absolute',
                top: trunkTop + 34,
                left: 12,
                right: 12,
                color: colors.mute,
                textAlign: 'center',
                fontFamily: fonts.regular,
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              Invita a alguien y el diagrama se abre en ramas.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  )
}

function TreeNode({ member, highlight }: { member: Member; highlight?: boolean }) {
  return (
    <View style={{ alignItems: 'center', width: NODE_W }}>
      <View
        style={{
          borderRadius: highlight ? 24 : 20,
          borderWidth: 1,
          borderColor: highlight ? 'rgba(85,214,160,0.7)' : 'rgba(85,214,160,0.28)',
          padding: 3,
          backgroundColor: highlight ? 'rgba(85,214,160,0.08)' : 'rgba(255,255,255,0.02)',
        }}
      >
        <Avatar name={member.name} size={highlight ? 56 : 46} />
      </View>
      <Text style={{ color: colors.cream, fontFamily: fonts.bold, marginTop: 8, textAlign: 'center', fontSize: 12 }} numberOfLines={1}>
        {member.name}
      </Text>
      <Text style={{ color: highlight ? colors.mint : colors.mute, fontSize: 10, fontFamily: fonts.semibold, marginTop: 2 }}>
        {roleLabel[member.role]}
      </Text>
    </View>
  )
}
