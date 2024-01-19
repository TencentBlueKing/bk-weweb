<template>
  <div>
    <h1>这个是 Vite 应用</h1>
    <customApp
      :url="url"
      id="vite"
    />
  </div>
</template>
<script lang="ts" setup>
import customApp from '../components/custom-app.vue';
const url = 'http://localhost:4001';
</script>
