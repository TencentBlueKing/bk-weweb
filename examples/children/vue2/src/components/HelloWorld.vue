<template>
  <div class="hello">
    <div class="echart-instance-warp" v-for="i in 10" :key='i'>
      <div class="echart-instance" :id="`echart_${i}`"></div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import 'echarts-gl';

const  ROOT_PATH = 'https://echarts.apache.org/examples';
const option = {
  backgroundColor: '#000',
  globe: {
    baseTexture: ROOT_PATH + '/data-gl/asset/world.topo.bathy.200401.jpg',
    heightTexture: ROOT_PATH + '/data-gl/asset/bathymetry_bw_composite_4k.jpg',
    displacementScale: 0.2,
    shading: 'realistic',
    environment: ROOT_PATH + '/data-gl/asset/starfield.jpg',
    realisticMaterial: {
      roughness: ROOT_PATH + '/asset/get/s/data-1497599804873-H1SHkG-mZ.jpg',
      metalness: ROOT_PATH + '/asset/get/s/data-1497599800643-BJbHyGWQW.jpg',
      textureTiling: [8, 4]
    },
    postEffect: {
      enable: true
    },
    viewControl: {
      autoRotate: false
    },
    light: {
      main: {
        intensity: 2,
        shadow: true
      },
      ambientCubemap: {
        texture: ROOT_PATH + '/data-gl/asset/pisa.hdr',
        exposure: 2,
        diffuseIntensity: 2,
        specularIntensity: 2
      }
    }
  }
};
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  mounted() {
    setTimeout(() => {
      console.time('echarts');
      for (let i = 1; i <= 10; i++) {
        const dom = this.$el.querySelector(`#echart_${i}`);
        const  myChart = echarts.init(dom);
        myChart.setOption(option);
      }
      console.timeEnd('echarts');
    }, 1000);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.hello {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}
.echart-instance {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 400px;
  margin: 10px;
}
</style>
