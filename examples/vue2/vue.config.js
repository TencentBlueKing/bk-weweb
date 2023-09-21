const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  lintOnSave: false,
  transpileDependencies: true,
});
