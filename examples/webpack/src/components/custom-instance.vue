<template>
  <div class="bk-weweb">
    <div ref="instanceWrap" />
    <div ref="testRef"></div>
    <h1>{{ message }}</h1>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { WewebMode, activated, deactivated, loadInstance } from '../../../../src/index';
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
const testRef = ref<HTMLElement>();
const message = ref('测试');
onMounted(async () => {
  await loadInstance({
    //   initSource: [
    //     'https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js',
    //     'https://cdn.jsdelivr.net/npm/echarts@4.8.0/dist/echarts.min.js'
    container: instanceWrap.value!,
    id: props.id,
    keepAlive: false,
    mode: WewebMode.INSTANCE,
    scopeCss: true,
    scopeJs: true,
    showSourceCode: true,
    // ],
    url: props.url,
  });
  activated(props.id, instanceWrap.value!, (instance, modules: any) => {
    console.log('activated==========', modules);
    modules.renderX(testRef.value!);
    message.value = modules.message;
  });
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
