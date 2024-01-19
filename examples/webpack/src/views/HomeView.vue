<template>
  <div class="home">
    <h1>this is vue3 home page</h1>
    <!-- <bk-weweb class="bk-weweb" id="baidu" url='http://localhost:8002'/> -->
    <!-- <PreloadSource/> -->
    <custom-app class="bk-weweb" />
    <!-- <CustomWebComponentApp/> -->
    <!-- <CustomWebComponentInstance/> -->
    <!-- <CustomIframe key="test2" appKey="test2"/> -->
    <!-- <bk-weweb :showSourceCode="true" setShodowDom="false" id="badu2" url="https://www.baidu.com/" /> -->
    <!-- <bk-weweb :showSourceCode="true" setShodowDom="true" id="qq" url="https://v.qq.com/" /> -->
    <!-- <bk-weweb id="sdfsdf" class="bk-weweb" mode="js" url="http://localhost:8001/index.js"/> -->
    <!-- <bk-weweb class="bk-weweb" mode="js" url="http://localhost:8001/index.js"/> -->

    <!-- <bk-weweb setShodowDom="true"  class="bk-weweb" url="http://v.qq.com"/> -->
    <!-- <bk-weweb :data="data" setShodowDom="true" id='tt' url="http://localhost:8002/"/> -->
  </div>
</template>

<script lang="ts" setup>
import CustomApp from '../components/custom-app.vue';
// import CustomInstance from '../components/custom-instance.vue';
// import CustomWebComponentApp from '../components/custom-webcomponent-app.vue';
// import CustomWebComponentInstance from '../components/custom-webcomponent-instance.vue';
// import PreloadSource from '../components/preload-srouce.vue';

</script>
<style lang="scss">
  .bk-weweb {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 600px;
    margin: 20px;
    overflow: hidden;
    border: 1px solid #ccc;
    border-radius: 2px;
    transform: rotate(0deg);
  }
</style>
