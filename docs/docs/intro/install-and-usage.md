### 安装

```bash
npm i @blueking/bk-weweb@latest
```

#### 主应用

```javascript
  import '@blueking/bk-weweb'
```


#### 嵌入子应用

```vue
  <bk-weweb id='test' url='http://www.baidu.com'/>
```


#### 嵌入子模块

```vue
  <bk-weweb id='test' mode='js' url='http://xxx.xx.js'/>
```