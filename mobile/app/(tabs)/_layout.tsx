import { Tabs } from 'expo-router'
import { View, Text, Platform } from 'react-native'
import { Home, Scale, FolderLock, Gift, User } from 'lucide-react-native'

function TabIcon({ icon: Icon, label, focused }: { icon: typeof Home; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 6, width: 64 }}>
      <Icon size={22} color={focused ? '#FF6B35' : '#64748B'} strokeWidth={focused ? 2.5 : 1.5} />
      <Text
        style={{
          color: focused ? '#FF6B35' : '#64748B',
          fontSize: 10,
          marginTop: 2,
          fontWeight: focused ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D1225',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={Home} label="Accueil" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="jurisia"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={Scale} label="JurisIA" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="proofvault"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={FolderLock} label="ProofVault" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="daily"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={Gift} label="Cadeau" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={User} label="Profil" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
