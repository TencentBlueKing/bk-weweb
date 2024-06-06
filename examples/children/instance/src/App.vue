<template>
  <div id="app">
    <img
      alt="Vue logo"
      src="./assets/logo.png"
    />
    <HelloWorld msg="你好吗 这是一个微模块测试ddd" />
  </div>
</template>
<script lang="ts">
  import Vue from 'vue';

  import HelloWorld from './components/HelloWorld.vue';

  export default Vue.extend({
    name: 'App',
    components: {
      HelloWorld,
    },
  });
</script>

<style>
  #app {
    margin-top: 60px;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    color: #2c3e50;
    text-align: center;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
</style>
