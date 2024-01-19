<template>
  <div class="common-app">
    <h1>这个是 Vue2 应用</h1>
    <customApp
      :url="url"
      id="vue2"
    />
  </div>
</template>
<script lang="ts" setup>
import customApp from '../components/custom-app.vue';
const url = 'http://localhost:4002';
</script>
