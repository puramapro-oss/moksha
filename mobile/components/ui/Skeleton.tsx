import { useEffect, useRef } from 'react'
import { Animated, View, type ViewStyle } from 'react-native'
import { COLORS } from '../../lib/constants'

type Props = { width?: number | string; height?: number; borderRadius?: number; style?: ViewStyle }

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: Props) {
  const opacityRef = useRef(new Animated.Value(0.3))

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityRef.current, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacityRef.current, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: COLORS.surface,
          opacity: opacityRef.current,
        },
        style,
      ]}
    />
  )
}
