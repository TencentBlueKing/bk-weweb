const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    host: 'localhost',
    port: 4003,
  },
  transpileDependencies: true,
});
