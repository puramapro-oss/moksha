import { View, type ViewStyle } from 'react-native'
import { COLORS } from '../../lib/constants'

type Props = {
  children: React.ReactNode
  style?: ViewStyle
  testID?: string
}

export function Card({ children, style, testID }: Props) {
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: COLORS.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: COLORS.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
