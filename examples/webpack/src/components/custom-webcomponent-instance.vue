<template>
  <custom-instance class="bk-weweb" />
</template>
<script lang="ts">
  import { defineComponent } from 'vue';

  import { activated, deactivated, loadInstance, mount, unmount } from '../../../../src/index';
  import { WewebMode } from '../../../../src/typings';

  export class InstanceElement extends HTMLElement {
    appKey = 'test-instance';
    isShadowDom = false;
    keepAlive = true;
    async connectedCallback() {
      if (this.isShadowDom && !this.shadowRoot) {
        this.attachShadow({ delegatesFocus: true, mode: 'open' });
      }
      await loadInstance({
        // initSource: [
        //   'https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js',
        //   'https://cdn.jsdelivr.net/npm/echarts@4.6.0/dist/echarts.min.js',
        container: this.shadowRoot ?? this,
        id: this.appKey,
        keepAlive: this.keepAlive,
        mode: WewebMode.INSTANCE,
        scopeCss: true,
        scopeJs: true,
        showSourceCode: true,
        // ],
        url: 'http://localhost:8004/index.js', // entry js 入口js
      });
      if (this.keepAlive) activated(this.appKey!, this.shadowRoot ?? this);
      else mount(this.appKey!, this.shadowRoot ?? this);
    }
    disconnectedCallback(): void {
      if (this.keepAlive) {
        deactivated(this.appKey!);
      } else unmount(this.appKey!);
    }
  }
  if (!window.customElements.get('custom-instance')) {
    window.customElements.define('custom-instance', InstanceElement);
  }
  export default defineComponent({});
</script>
<style lang="scss">
  .bk-weweb {
    display: flex;
    width: 800px;
    height: 200px;
  }
</style>
