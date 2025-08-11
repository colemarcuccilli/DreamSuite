import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { getGridColumns, responsive, isDesktop } from '../../utils/responsive'

interface ResponsiveGridProps {
  children: React.ReactNode
  spacing?: number
  columns?: number
  style?: ViewStyle
}

export default function ResponsiveGrid({ 
  children, 
  spacing = 16, 
  columns,
  style 
}: ResponsiveGridProps) {
  const gridColumns = columns || getGridColumns()
  const childrenArray = React.Children.toArray(children)
  
  // For mobile, use vertical layout
  if (!isDesktop()) {
    return (
      <View style={[styles.mobileContainer, { gap: spacing }, style]}>
        {children}
      </View>
    )
  }

  // For desktop, use grid layout
  const rows: React.ReactNode[][] = []
  for (let i = 0; i < childrenArray.length; i += gridColumns) {
    rows.push(childrenArray.slice(i, i + gridColumns))
  }

  return (
    <View style={[styles.gridContainer, style]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.gridRow, { gap: spacing }]}>
          {row.map((child, childIndex) => (
            <View key={childIndex} style={[styles.gridItem, { flex: 1 }]}>
              {child}
            </View>
          ))}
          {/* Fill remaining space if row is not full */}
          {row.length < gridColumns && 
            Array(gridColumns - row.length).fill(null).map((_, index) => (
              <View key={`empty-${index}`} style={[styles.gridItem, { flex: 1 }]} />
            ))
          }
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  gridContainer: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
  },
})