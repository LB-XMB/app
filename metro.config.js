// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-svg is pulled in by several UI packages; dedupe it so a single
// copy is bundled (mismatched copies break lucide icon rendering).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return context.resolveRequest(
      { ...context, originModulePath: `${__dirname}/index.js` },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
