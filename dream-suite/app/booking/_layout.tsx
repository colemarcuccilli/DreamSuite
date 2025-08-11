import React from 'react'
import { Stack } from 'expo-router'

export default function BookingLayout() {
  return (
    <Stack screenOptions={{ 
      headerStyle: {
        backgroundColor: '#2081C3',
      },
      headerTintColor: 'white',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
      <Stack.Screen 
        name="[studioId]" 
        options={{
          title: 'Book a Session',
        }}
      />
      <Stack.Screen 
        name="success/[bookingId]" 
        options={{
          title: 'Booking Complete',
        }}
      />
      <Stack.Screen 
        name="cancel/[bookingId]" 
        options={{
          title: 'Payment Cancelled',
        }}
      />
    </Stack>
  )
}