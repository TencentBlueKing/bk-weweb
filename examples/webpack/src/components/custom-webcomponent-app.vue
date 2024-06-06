<template>
  <custom-app class="bk-weweb" />
</template>
<script lang="ts">
  import { defineComponent } from 'vue';

  import { activated, deactivated, loadApp, unmount } from '../../../../src/index';

  export class AppElement extends HTMLElement {
    appKey = 'test-app';
    isShadowDom = false;
    keepAlive = false;
    async connectedCallback() {
      if (this.isShadowDom && !this.shadowRoot) {
        this.attachShadow({ delegatesFocus: true, mode: 'open' });
      }
      await loadApp({
        container: this.shadowRoot,
        data: {},
        id: this.appKey,
        keepAlive: this.keepAlive,
        scopeCss: true,
        scopeLocation: true,
        setShodowDom: this.isShadowDom,
        showSourceCode: true,
        url: 'https://www.google.com.hk/',
      });
      activated(this.appKey!, this.shadowRoot ?? this);
    }
    disconnectedCallback(): void {
      if (this.keepAlive) {
        deactivated(this.appKey!);
      } else unmount(this.appKey!);
    }
  }
  if (!window.customElements.get('custom-app')) {
    window.customElements.define('custom-app', AppElement);
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
