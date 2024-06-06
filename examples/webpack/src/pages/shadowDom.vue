<template>
  <div class="common-app">
    <h1>这个是 Shadow DOM React 应用</h1>
    <bk-weweb
      id="react"
      :set-shodow-dom="true"
      :url="url"
    />
  </div>
</template>
<script lang="ts" setup>
  const url = 'http://localhost:4004';
</script>
