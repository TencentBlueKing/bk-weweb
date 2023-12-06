<template>
  <div class="bk-weweb">
    <div ref="instanceWrap"></div>
  </div>
</template>
<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';

import { loadApp, mount, unmount } from '../../../../src/index';

export default defineComponent({
  setup() {
    const instanceWrap = ref<HTMLElement>(null);
    const appKey = 'testApp';
    onMounted(async () => {
      await loadApp({
        data: {},
        id: appKey,
        keepAlive: false,
        scopeCss: true,
        scopeLocation: true,
        setShodowDom: false,
        showSourceCode: true,
        url: 'http://localhost:8002/',
      });
      mount(appKey, instanceWrap.value);
    });
    onBeforeUnmount(() => {
      unmount(appKey);
    });
    return {
      instanceWrap,
    };
  },
});
</script>
<style lang="scss">
.bk-weweb {
  display: flex;
  width: 800px;
  height: 200px;
}
</style>
