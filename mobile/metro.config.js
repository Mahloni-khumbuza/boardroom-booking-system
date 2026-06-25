const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Mirror the @/ alias from tsconfig and babel so Metro resolves it correctly.
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

module.exports = config;
