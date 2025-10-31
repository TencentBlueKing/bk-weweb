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
    keepAlive?: true;
    scopeCss?: boolean;
    scopeLocation?: boolean;
    setShadowDom?: boolean;
    showSourceCode?: boolean;
    url: string;
    data: Record<string, unknown>;
  }>();
  const instanceWrap = ref<HTMLElement>();
  onMounted(async () => {
    await loadApp({
      data: props.data || {},
      id: props.id,
      keepAlive: false,
      scopeCss: true,
      scopeLocation: false,
      setShadowDom: false,
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
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
</style>
