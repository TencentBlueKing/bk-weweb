<template>
  <div class="common-app-all">
    <div class="instance">
      <customApp
        id="react"
        :url="reacturl"
      />
    </div>
    <div
      style="margin-left: 10px"
      class="instance"
    >
      <CustomInstance
        id="instance"
        :url="url"
      />
    </div>
    <div class="instance">
      <customApp
        id="vue2"
        :url="vue2url"
      />
    </div>
  </div>
</template>
<script lang="ts" setup>
  import customApp from '../components/custom-app.vue';
  import CustomInstance from '../components/custom-instance.vue';
  const url = 'http://localhost:4005/index.js';
  const reacturl = 'http://localhost:4004';
  const vue2url = 'http://localhost:4002';
</script>
<style lang="scss">
  .common-app-all {
    display: flex;
    align-items: center;
    width: 100%;
    height: 600px;

    .instance {
      flex: 1;
    }
  }
</style>
