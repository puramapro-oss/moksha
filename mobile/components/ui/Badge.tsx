import { View, Text } from 'react-native'
import { COLORS } from '../../lib/constants'

type Props = {
  label: string
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info'
}

export function Badge({ label, variant = 'primary' }: Props) {
  const bg = {
    primary: COLORS.primary + '20',
    success: '#22C55E20',
    warning: '#F59E0B20',
    error: '#EF444420',
    info: '#3B82F620',
  }[variant]

  const color = {
    primary: COLORS.primary,
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  }[variant]

  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  )
}
