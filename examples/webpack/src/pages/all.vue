<template>
  <div class="common-app">
    <div class="instance">
    <customApp
      :url="reacturl"
      id="react"
    />
    </div>
    <div class="instance" style="margin-left: 10px;">
      <CustomInstance
        :url="url"
        id="instance"
      />
    </div>
    <div class="instance">
    <customApp
      :url="vue2url"
      id="vue2"
    />
    </div>
  </div>
</template>
<script lang="ts" setup>
import CustomInstance from '../components/custom-instance.vue';
import customApp from '../components/custom-app.vue';
const url = 'http://localhost:4005/index.js';
const reacturl = 'http://localhost:4004';
const vue2url = 'http://localhost:4002';
</script>
<style lang="scss">
.common-app {
  display: flex;
  align-items: center;
  width: 100%;
  height: 600px;

  .instance {
    flex: 1;
  }
}
</style>