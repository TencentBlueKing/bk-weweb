<template>
  <div class="bk-weweb">
    <div ref="instanceWrap" />
  </div>
</template>
<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';

import { WewebMode, activated, deactivated, loadInstance } from '../../../../src/index';

export default defineComponent({
  setup() {
    const instanceWrap = ref<HTMLElement>(null);
    const id = 'test-instance';
    onMounted(async () => {
      await loadInstance({
        //   initSource: [
        //     'https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js',
        //     'https://cdn.jsdelivr.net/npm/echarts@4.8.0/dist/echarts.min.js'
        container: instanceWrap.value!,
        id,
        keepAlive: false,
        mode: WewebMode.INSTANCE,
        scopeCss: true,
        scopeJs: true,
        showSourceCode: true,
        // ],
        url: 'http://localhost:8004/index.js'
      });
      activated(id, instanceWrap.value);
    });
    onBeforeUnmount(() => {
      deactivated(id);
    });
    return {
      instanceWrap
    };
  }
});
</script>
<style lang="scss">
  .bk-weweb {
    display: flex;
    flex-direction: column;
    width: 800px;
    height: 800px;
  }
</style>
