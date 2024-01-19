const { defineConfig } = require('@vue/cli-service');
const { resolve } = require('path');
//
module.exports = defineConfig({
  chainWebpack: config => {
    config.plugins.delete('html');
    config.plugins.delete('preload');
    config.plugins.delete('prefetch');
    config.plugins.delete('eslint');
  },
  configureWebpack: config => {
    config.entry = { index: './src/main.ts' };
    config.output = {
      filename: 'index.js',
      libraryTarget: 'umd',
      path: config.output.path,
      publicPath: '/',
    };
    config.devServer = {
      ...config.devServer,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      host: 'localhost',
      port: 4005,
    };
    config.cache = false;
    config.optimization = {};
  },
  // transpileDependencies: true,
  filenameHashing: false,
});
