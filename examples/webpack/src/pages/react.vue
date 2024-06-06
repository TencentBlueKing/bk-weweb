<template>
  <div class="common-app">
    <h1>这个是 React 应用</h1>
    <customApp
      id="react"
      :scope-location="true"
      :url="url"
    />
  </div>
</template>
<script lang="ts" setup>
  import customApp from '../components/custom-app.vue';
  const url = 'http://localhost:4004';
</script>
