import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { 
  getContainerWidth, 
  getResponsivePadding, 
  getWebStyles, 
  isWeb, 
  isDesktop 
} from '../../utils/responsive'

interface ResponsiveContainerProps {
  children: React.ReactNode
  style?: ViewStyle
  centerContent?: boolean
  maxWidth?: number | string
  padding?: number
}

export default function ResponsiveContainer({ 
  children, 
  style, 
  centerContent = true,
  maxWidth,
  padding
}: ResponsiveContainerProps) {
  const containerStyle: ViewStyle = {
    ...getWebStyles(),
    width: '100%',
    maxWidth: maxWidth || getContainerWidth(),
    paddingHorizontal: padding || getResponsivePadding(),
    ...(centerContent && isDesktop() && {
      marginHorizontal: 'auto',
      alignSelf: 'center',
    }),
    ...style,
  }

  return (
    <View style={containerStyle}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})