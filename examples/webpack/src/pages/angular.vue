<template>
  <div>
    <h1>这个是 React 应用</h1>
    <customApp
      :show-source-code="false"
      :url="url"
      id="angular"
    />
  </div>
</template>
<script lang="ts" setup>
import customApp from '../components/custom-app.vue';
const url = 'http://localhost:4200';
</script>
