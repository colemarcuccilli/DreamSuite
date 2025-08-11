import React from 'react'
import { Tabs } from 'expo-router'
import { Platform } from 'react-native'

function TabBarIcon(props: {
  name: string
  color: string
}) {
  const iconMap: { [key: string]: string } = {
    'dashboard': '📊',
    'bookings': '📅',
    'services': '🎵',
    'calendar': '🗓️',
    'settings': '⚙️',
  }
  
  return <span style={{ color: props.color, fontSize: 20 }}>{iconMap[props.name] || '●'}</span>
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2081C3',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
        headerTitle: 'Studio Admin',
        headerStyle: {
          backgroundColor: '#2081C3',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <TabBarIcon name="bookings" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => <TabBarIcon name="services" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  )
}