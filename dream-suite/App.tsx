import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import 'react-native-url-polyfill/auto'

// Import screens
import HomeScreen from './app/index'
import BookingScreen from './components/BookingScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'Dream Suite' }}
          />
          <Stack.Screen 
            name="Booking" 
            component={BookingScreen}
            options={{ title: 'Book a Session' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  )
}