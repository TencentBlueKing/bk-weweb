<template>
  <div class="common-app">
    <h1>这个是 Vite 应用</h1>
    <customApp
      id="vite"
      :url="url"
    />
  </div>
</template>
<script lang="ts" setup>
  import customApp from '../components/custom-app.vue';
  const url = 'http://localhost:4001';
</script>
