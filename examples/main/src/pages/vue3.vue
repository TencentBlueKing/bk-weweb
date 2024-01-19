<template>
  <div class="common-app">
    <h1>这个是 Vue3 应用</h1>
    <customApp
      :url="url"
      id="vue3"
    />
  </div>
</template>
<script lang="ts" setup>
import customApp from '../components/custom-app.vue';
const url = 'http://localhost:4003';
</script>
