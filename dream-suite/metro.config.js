const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required for Expo Router
config.resolver.sourceExts.push('mjs');

module.exports = config;