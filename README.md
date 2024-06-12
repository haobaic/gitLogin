# 设置 gittee/github 登录

## 运行

```sh
pnpm install
```

### 启动项目

```sh
pnpm dev
```

### 启动服务

```sh
pnpm service
```

## 配置环境变量

修改 .env 内容

```
GITEE_CLIENT_ID:gitee的client_id
GITEE_CLIENT_SECRET:gitee的client_secret
GITEE_REDIRECT_URI:gitee的应用回调地址

GITHUB_CLIENT_ID:github的client_id
GITHUB_CLIENT_SECRET:github的client_secret
GITHUB_REDIRECT_URI:github的client_secret

PORT:服务默认端口
```

## 注意

项目默认端口为 6788
服务默认端口为 7001
