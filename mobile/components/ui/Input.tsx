import { View, TextInput, Text, type ViewStyle } from 'react-native'
import { useState } from 'react'
import { COLORS } from '../../lib/constants'

type Props = {
  label?: string
  placeholder?: string
  value: string
  onChangeText: (v: string) => void
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  error?: string
  multiline?: boolean
  numberOfLines?: number
  style?: ViewStyle
  testID?: string
}

export function Input({
  label, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, error, multiline, numberOfLines, style, testID,
}: Props) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label && (
        <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 12,
          padding: 14,
          color: '#FFFFFF',
          fontSize: 16,
          borderWidth: 1.5,
          borderColor: error ? COLORS.error : focused ? COLORS.primary : COLORS.border,
          minHeight: multiline ? 100 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
      {error && (
        <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  )
}
