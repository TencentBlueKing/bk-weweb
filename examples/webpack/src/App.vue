<template>
  <div>
    <bk-navigation
      :default-open="true"
      navigation-type="top-bottom"
      side-title="蓝鲸微前端"
    >
      <template #menu>
        <bk-menu
          :active-key="activeMenu"
          @update:active-key="handleMenuChange"
        >
          <bk-menu-item key="home">首页</bk-menu-item>
          <bk-menu-item key="react">react应用</bk-menu-item>
          <bk-menu-item key="iframe">iframe应用</bk-menu-item>
          <bk-menu-item key="instance">微模块</bk-menu-item>
          <bk-menu-item key="all">多应用</bk-menu-item>
          <bk-menu-item key="vue3">vue3应用</bk-menu-item>
          <bk-menu-item key="vue2">vue2应用</bk-menu-item>
          <bk-menu-item key="shadowDom">shadowDom应用</bk-menu-item>
          <bk-menu-item key="vite">vite</bk-menu-item>
          <bk-menu-item key="angular">angular</bk-menu-item>
        </bk-menu>
      </template>
      <div class="route-wrapper">
        <RouterView />
      </div>
    </bk-navigation>
  </div>
</template>
<script setup lang="ts">
  import { computed } from 'vue';
  import { RouterView, useRoute, useRouter } from 'vue-router';
  const route = useRoute();
  const router = useRouter();
  const activeMenu = computed<string>(() => {
    return route.name?.toString() || 'home';
  });
  function handleMenuChange(v: string) {
    console.log(v);
    router.push({ name: v });
  }
</script>
<style scoped lang="scss">
  .bk-navigation {
    height: 100vh;
  }

  .route-wrapper {
    display: flex;
    justify-content: center;
    height: 100%;
    padding-top: 30px;
    background-color: #f5f5f5;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
</style>
