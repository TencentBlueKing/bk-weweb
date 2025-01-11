<template>
  <div>
    <h1>这个是 Angular 应用</h1>
    <customApp
      id="angular"
      :show-source-code="false"
      :url="url"
    />
  </div>
</template>
<script lang="ts" setup>
  import customApp from '../components/custom-app.vue';
  const url = 'http://localhost:4200';
</script>
