<template>
  <div class="bk-weweb">
    <div ref="instanceWrap"></div>
  </div>
</template>
<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { activated, deactivated, loadApp } from '../../../../src/index';
const props = defineProps<{
  id: string;
  keepAlive?: boolean;
  scopeCss?: boolean;
  scopeLocation?: boolean;
  setShodowDom?: boolean;
  showSourceCode?: boolean;
  url: string;
}>();
const instanceWrap = ref<HTMLElement>();
onMounted(async () => {
  await loadApp({
    data: {},
    id: props.id,
    keepAlive: false,
    scopeCss: true,
    scopeLocation: true,
    setShodowDom: false,
    showSourceCode: true,
    url: props.url,
  });
  activated(props.id, instanceWrap.value!);
});
onBeforeUnmount(() => {
  deactivated(props.id);
});
</script>
<style lang="scss">
.bk-weweb {
  display: flex;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, .1);
}
</style>
