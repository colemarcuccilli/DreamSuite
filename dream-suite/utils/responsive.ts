import { Dimensions, Platform } from 'react-native'

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

// Define breakpoints
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1200,
}

// Check if we're on web platform
export const isWeb = Platform.OS === 'web'

// Screen size helpers
export const getScreenSize = () => {
  if (screenWidth >= breakpoints.largeDesktop) return 'largeDesktop'
  if (screenWidth >= breakpoints.desktop) return 'desktop'
  if (screenWidth >= breakpoints.tablet) return 'tablet'
  return 'mobile'
}

export const isMobile = () => getScreenSize() === 'mobile'
export const isTablet = () => getScreenSize() === 'tablet'
export const isDesktop = () => ['desktop', 'largeDesktop'].includes(getScreenSize())
export const isLargeDesktop = () => getScreenSize() === 'largeDesktop'

// Responsive value helper
export const responsive = (values: {
  mobile?: any
  tablet?: any
  desktop?: any
  largeDesktop?: any
}) => {
  const screenSize = getScreenSize()
  return values[screenSize as keyof typeof values] || values.mobile || values.desktop || Object.values(values)[0]
}

// Container width helpers
export const getContainerWidth = () => {
  const screenSize = getScreenSize()
  switch (screenSize) {
    case 'mobile':
      return '100%'
    case 'tablet':
      return Math.min(screenWidth * 0.9, 600)
    case 'desktop':
      return Math.min(screenWidth * 0.8, 800)
    case 'largeDesktop':
      return Math.min(screenWidth * 0.7, 1000)
    default:
      return '100%'
  }
}

// Padding helpers
export const getResponsivePadding = () => {
  return responsive({
    mobile: 20,
    tablet: 32,
    desktop: 40,
    largeDesktop: 48,
  })
}

// Grid column helpers
export const getGridColumns = () => {
  return responsive({
    mobile: 1,
    tablet: 2,
    desktop: 2,
    largeDesktop: 3,
  })
}

// Font size helpers
export const getResponsiveFontSize = (baseSize: number) => {
  const multiplier = responsive({
    mobile: 1,
    tablet: 1.1,
    desktop: 1.2,
    largeDesktop: 1.3,
  })
  return baseSize * multiplier
}

// Component sizing helpers
export const getComponentMaxWidth = () => {
  return responsive({
    mobile: '100%',
    tablet: 500,
    desktop: 600,
    largeDesktop: 700,
  })
}

// Web-specific styles
export const getWebStyles = () => {
  if (!isWeb) return {}
  
  return {
    // Ensure proper scrolling on web
    overflow: isDesktop() ? 'auto' : 'hidden',
    // Center content on larger screens
    alignSelf: isDesktop() ? 'center' : 'stretch',
    // Max width for desktop
    maxWidth: isDesktop() ? getContainerWidth() : '100%',
    // Min height for proper layout
    minHeight: isWeb ? '100vh' : 'auto',
  }
}

// Layout helpers for responsive design
export const getLayoutStyle = () => {
  return {
    flexDirection: responsive({
      mobile: 'column',
      tablet: 'column', 
      desktop: 'row',
    }) as 'column' | 'row',
    alignItems: responsive({
      mobile: 'stretch',
      tablet: 'stretch',
      desktop: 'flex-start',
    }) as 'stretch' | 'flex-start',
    justifyContent: responsive({
      mobile: 'flex-start',
      tablet: 'flex-start', 
      desktop: 'center',
    }) as 'flex-start' | 'center',
  }
}