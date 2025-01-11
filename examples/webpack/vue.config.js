//
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    host: 'localhost',
  },
  transpileDependencies: true,
  chainWebpack: config => {
    // 移除类型检查插件
    config.plugins.delete('fork-ts-checker');
  },
});
