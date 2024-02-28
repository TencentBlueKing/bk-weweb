<template>
  <div class="common-app">
    <h1>这个是 Iframe React 应用</h1>
    <iframe
      :src="url"
      id="react"
    />
  </div>
</template>
<script lang="ts" setup>
const url = 'http://localhost:4004';
</script>
<style lang="scss">
iframe {
  display: flex;
  width: 600px;
  height: 700px;
  border: none;
}
</style>
