# 启动chat-demo指引

## 环境
### node + npm 环境
1. node 推荐使用v14.21.3
2. npm 推荐使用v6.14.18

### port 可用检测
mac上可以使用以下命令,查看3000端口和9091端口是否被占用,占用情况会影响本地服务启动
```
lsof -i :3000
lsof -i :9091
```

windows上可用
```
netstat -ano | findstr :3000
netstat -ano | findstr :9091
```

## 配置通用配置项
### 服务配置项
路径：scripts/static.js

1. 客户的secretId:

const secretId = '在云控制台的-API密钥管理 中获取';

2. 客户的secretKey:

const secretKey = '在云控制台的-API密钥管理 中获取';

3. 体验机器人的appkey:

const appId = '在大模型-应用管理-调用 中获取appkey'; 

### web配置项
路径：src/constants/static.js

1. 标识ws模式还是sse模式链接对话，可选值ws和sse

const ACCESS_TYPE = 'sse'; 

2. 体验机器人的appkey，同上服务配置项中appId

const APP_KEY = '在大模型-应用管理-调用 中获取appkey;

## 配置完毕后，执行脚本
``` bash
# 安装依赖
npm install

# 启动服务 at http://localhost:3000/
npm run serve

# 启动web at lhttp://localhost:9091
npm run dev

# 打开页面
http://localhost:9091/#/chat-demo

```

# Build Setup

``` bash
# install dependencies
npm install

# Server running at http://localhost:3000/
npm run serve

# serve with hot reload at lhttp://localhost:9091
npm run dev

# 打开页面
http://localhost:9091/#/chat-demo

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```
