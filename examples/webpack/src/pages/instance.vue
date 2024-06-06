<template>
  <div class="common-app">
    <h1>这个是 React 应用</h1>
    <CustomInstance
      id="instance"
      :url="url"
    />
  </div>
</template>
<script lang="ts" setup>
  import CustomInstance from '../components/custom-instance.vue';
  const url = 'http://localhost:4005/index.js';
</script>
