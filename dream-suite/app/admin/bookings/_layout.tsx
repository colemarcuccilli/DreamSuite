import React from 'react'
import { Stack } from 'expo-router'

export default function BookingsLayout() {
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
        name="index" 
        options={{
          title: 'All Bookings',
        }}
      />
      <Stack.Screen 
        name="[bookingId]" 
        options={{
          title: 'Booking Details',
        }}
      />
      <Stack.Screen 
        name="new" 
        options={{
          title: 'New Booking',
        }}
      />
    </Stack>
  )
}