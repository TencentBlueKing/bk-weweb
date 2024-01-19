<template>
  <div>
    <Navigation
      :default-open="true"
      navigation-type="top-bottom"
      side-title="蓝鲸微前端"
    >
      <template #menu>
        <Menu
          :active-key="activeMenu"
          @update:active-key="handleMenuChange"
        >
          <Menu.Item key="home">首页</Menu.Item>
          <Menu.Item key="react">react应用</Menu.Item>
          <Menu.Item key="iframe">iframe应用</Menu.Item>
          <Menu.Item key="instance">微模块</Menu.Item>
          <Menu.Item key="vue3">vue3应用</Menu.Item>
          <Menu.Item key="vue2">vue2应用</Menu.Item>
          <Menu.Item key="shadowDom">shadowDom应用</Menu.Item>
          <!-- <Menu.Item key="vite">vite</Menu.Item>
          <Menu.Item key="angular">angular</Menu.Item> -->
        </Menu>
      </template>
      <div class="route-wrapper">
        <RouterView />
      </div>
    </Navigation>
  </div>
</template>
<script setup lang="ts">
import { Menu, Navigation } from 'bkui-vue';
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
  box-shadow: 0 0 10px rgba(0, 0, 0, .1);
}
</style>
