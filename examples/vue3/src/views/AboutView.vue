<template>
  <div class="about">
    <h1>this is vue3 about page</h1>
    <!-- <CustomApp/> -->
    <custom-instance class="bk-weweb" />
    <!-- <CustomApp/>
    <CustomWebComponentInstance/>
    <CustomInstance appKey="test1"/> -->
    <br>
    <!-- <bk-weweb id="badu1" url="https://www.baidu.com/" /> -->
    <!-- <bk-weweb id="baidu" class="bk-weweb" mode="js" url="http://localhost:8001/index.js"/> -->
  </div>
</template>
<script lang="ts" setup>

// import CustomApp from '../components/custom-app.vue';
import CustomInstance from '../components/custom-instance.vue';
// import CustomWebComponentInstance from '../components/custom-webcomponent-instance.vue';

</script>
<style>
  .bk-weweb {
    position: relative;
    display: flex;
    width: calc(100% - 40px);
    height: 600px;
    margin: 20px;
    overflow: auto;

    /* transform: rotate(0deg); */
  }
</style>
