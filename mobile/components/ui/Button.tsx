import { TouchableOpacity, Text, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native'
import { COLORS } from '../../lib/constants'

type Props = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  style?: ViewStyle
  textStyle?: TextStyle
  testID?: string
}

export function Button({
  title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, style, textStyle, testID,
}: Props) {
  const isDisabled = disabled || loading

  const bgColor = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    outline: 'transparent',
    ghost: 'transparent',
  }[variant]

  const borderColor = variant === 'outline' ? COLORS.primary : 'transparent'
  const textColor = variant === 'secondary' ? '#070B18' : '#FFFFFF'

  const padY = { sm: 8, md: 12, lg: 16 }[size]
  const padX = { sm: 16, md: 24, lg: 32 }[size]
  const fontSize = { sm: 14, md: 16, lg: 18 }[size]

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderRadius: 12,
          paddingVertical: padY,
          paddingHorizontal: padX,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[{ color: textColor, fontSize, fontWeight: '600' }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  )
}
