/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
import { type RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    component: () => import(/* webpackChunkName: "home" */ '../pages/home.vue'),
    name: 'home',
    path: '/',
  },
  {
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../pages/vue3.vue'),
    name: 'vue3',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    path: '/vue3',
  },
  {
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../pages/vue2.vue'),
    name: 'vue2',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    path: '/vue2',
  },
  {
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../pages/react.vue'),
    name: 'react',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    path: '/react',
  },
  {
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../pages/iframe.vue'),
    name: 'iframe',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    path: '/iframe',
  },
  {
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../pages/instance.vue'),
    name: 'instance',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    path: '/instance',
  },
  {
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../pages/angular.vue'),
    name: 'angular',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    path: '/angular',
  },
  {
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../pages/vite.vue'),
    name: 'vite',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    path: '/vite',
  },
  {
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../pages/shadowDom.vue'),
    name: 'shadowDom',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    path: '/shadowDom',
  },
  // {
  //   path: '/:pathMatch(.*)*',
  //   redirect: '/',
  // },
];
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
