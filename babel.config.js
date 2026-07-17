const path = require('path');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    [
      require.resolve("babel-plugin-module-resolver"),
      {
        extensions: [".ts", ".tsx", ".js", ".ios.js", ".android.js"],
        alias: {
          "@api": path.resolve(__dirname, "src/api"),
          "@assets": path.resolve(__dirname, "src/assets"),
          "@components": path.resolve(__dirname, "src/components"),
          "@db": path.resolve(__dirname, "src/db"),
          "@i18n": path.resolve(__dirname, "src/i18n"),
          "@hooks": path.resolve(__dirname, "src/hooks"),
          "@navigation": path.resolve(__dirname, "src/navigation"),
          "@screens": path.resolve(__dirname, "src/screens"),
          "@store": path.resolve(__dirname, "src/store"),
          "@theme": path.resolve(__dirname, "src/theme"),
          "@types": path.resolve(__dirname, "src/types"),
          "@utils": path.resolve(__dirname, "src/utils"),
        }
      }
    ],
  ],
};
