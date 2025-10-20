<template>
  <div class="common-app vite-app">
    <h1>这个是 Vite 应用</h1>
    <customApp
      id="vite"
      :data="{
        baseroute: '/vite/',
      }"
      :url="url"
    />
  </div>
</template>
<script lang="ts" setup>
  import customApp from '../components/custom-app.vue';
  const url = 'http://localhost:4001';
</script>
<style>
  .vite-app {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    transform: rotate(0deg);
  }
</style>
