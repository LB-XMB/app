// Learn more: https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const shims = {
  net: path.resolve(__dirname, 'shims/net.js'),
  tls: path.resolve(__dirname, 'shims/tls.js'),
  fs: path.resolve(__dirname, 'shims/fs.js'),
  crypto: path.resolve(__dirname, 'shims/crypto.js'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('buffer'),
  events: require.resolve('events'),
  string_decoder: require.resolve('string_decoder'),
  zlib: require.resolve('browserify-zlib'),
  path: require.resolve('path-browserify'),
  'cpu-features': path.resolve(__dirname, 'shims/empty.js'),
};

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  ...shims,
};

const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Deduplicate react-native-svg (lucide + other UI packages).
  if (moduleName === 'react-native-svg') {
    return context.resolveRequest(
      { ...context, originModulePath: `${__dirname}/index.js` },
      moduleName,
      platform
    );
  }

  const bare = moduleName.startsWith('node:') ? moduleName.slice(5) : moduleName;
  if (Object.prototype.hasOwnProperty.call(shims, bare)) {
    return { type: 'sourceFile', filePath: shims[bare] };
  }

  if (typeof previousResolveRequest === 'function') {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
