const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  pages: {
    index: {
      entry: 'src/main.js',
    },
  },
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    host: 'localhost',
    port: 4002,
  },
  transpileDependencies: true,
  chainWebpack: (config) => {
    config.plugins.delete('fork-ts-checker');
  },
});
