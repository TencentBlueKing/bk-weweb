<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <h2>我是一个vue2 web 应用</h2>
    <HelloWorld></HelloWorld>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
export default {
  components: {
    HelloWorld
  },
  name: 'App'
}
</script>

<style>
#app {
  min-width: 800px;
  margin-top: 60px;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: center;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
