<template>
  <div class="bk-weweb">
    <div ref="instanceWrap" />
  </div>
</template>
<script lang="ts" setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { activated, loadInstance, unmount } from '../../../../src/index';

const instanceWrap = ref<HTMLElement>(null);
const test = reactive({
  text: 'hello world'
});
onMounted(async () => {
  await loadInstance({
    data: {
      on: {
        click: () => {
          console.log('click');
          alert('click==========');
        }
      },
      props: {
        text: 'hello world'
      }
    },
    id: 'test1',
    initSource: [
      'https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js',
      'https://cdn.jsdelivr.net/npm/echarts@4.8.0/dist/echarts.min.js',
    ],
    keepAlive: true,
    scopeCss: true,
    scopeJs: true,
    showSourceCode: true,
    url: 'http://localhost:8004/index.js'
  });
  // mount('test1')
  activated<{
    Test: any
    Vue: any,
  }>('test1', instanceWrap.value, (a, b) => {
    console.log(a, b);
    const div = document.createElement('div');
    instanceWrap.value.appendChild(div);
    const instance = new b.Vue({
      components: {
        Test: b.Test
      },
      el: div,
      render(h) {
        return h('test', {
          on: {
            click: () => {
              console.log(instance);
              instance.$children[0].text = 'sdfsdfsdfsdf';
              alert('sdfsdfsdfsdf');
            }
          },
          props: {
            text: test.text
          }
        });
      }
    });
  });
});
onBeforeUnmount(() => {
  unmount('test1');
});
</script>
