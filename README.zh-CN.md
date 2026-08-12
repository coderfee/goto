# goto

[English](./README.md)

一个运行在 Cloudflare Workers 上的极简短链跳转服务。把自己域名下的短路径映射到任意地址：

```
go.example.com/github  ->  https://github.com/<username>
go.example.com/x       ->  https://x.com/<username>
```

剩余路径和查询参数会透传，例如 `go.example.com/github/goto?tab=readme` 会跳转到 `https://github.com/<username>/goto?tab=readme`。

## 特性

- **路径式短链** —— 一个 Worker、一个域名，路由数量不限
- **路径与 query 透传** —— 深层链接开箱即用
- **路由外置配置** —— 路由表放在环境变量里（本地 `.dev.vars`，生产用 secret），不写死在代码中
- **默认安全** —— 仅允许 `GET`/`HEAD`，目标仅限 `https:`，启动时严格校验路由配置
- **结构化访问日志** —— 每个请求输出 JSON 日志（结果、状态码、key、目标地址、国家、UA），可通过 `wrangler tail` 或 Cloudflare Dashboard 查看

## 快速开始

前置条件：[pnpm](https://pnpm.io/)、Cloudflare 账号、域名 DNS 托管在 Cloudflare。

```bash
pnpm install
cp .dev.vars.example .dev.vars   # 然后编辑你的路由
pnpm dev                         # http://localhost:8788
```

试一下：

```bash
curl -sI http://localhost:8788/github
# HTTP/1.1 302 Found
# Location: https://github.com/<username>
```

## 配置

路由通过 `ROUTES` 环境变量定义，JSON 对象：短链 key -> `https://` 目标地址：

```json
ROUTES={"github":"https://github.com/<username>","x":"https://x.com/<username>"}
```

- **本地**：写在 `.dev.vars`（已被 gitignore）
- **生产**：部署后设置为 secret：

  ```bash
  npx wrangler secret put ROUTES
  ```

启动时会强制校验（配置错误会直接 500 并输出错误日志，快速失败）：

- key 必须匹配 `^[a-z0-9][a-z0-9-]*$`
- 目标必须是合法的 `https:` URL（不允许内嵌凭据），或纯邮箱的 `mailto:` 地址（如 `mailto:you@example.com`）—— mailto 路由会返回一个自动调起访客邮箱客户端的页面
- 任何值都可以用 `b64:<base64>` 形式存放（如 `b64:bWFpbHRvOnlvdUBleGFtcGxlLmNvbQ==`），避免明文出现在配置中，Worker 启动时自动解码

修改绑定配置后，执行 `pnpm cf-typegen` 重新生成 `Env` 类型。

## 部署

1. 确保域名 DNS 托管在 Cloudflare。
2. 在 `wrangler.jsonc` 中把自定义域名指向 Worker：

   ```jsonc
   "routes": [{ "pattern": "go.example.com", "custom_domain": true }]
   ```

3. 部署并设置路由 secret：

   ```bash
   pnpm deploy
   npx wrangler secret put ROUTES
   ```

wrangler 会自动为自定义域名创建 DNS 记录。

## 开发

| 命令              | 说明                                |
| ----------------- | ----------------------------------- |
| `pnpm dev`        | 本地开发服务器                      |
| `pnpm check`      | Biome 格式化 + lint（自动修复）     |
| `pnpm format`     | 仅格式化                            |
| `pnpm lint`       | 仅 lint                             |
| `pnpm cf-typegen` | 通过 wrangler 重新生成 `Env` 类型   |
| `pnpm deploy`     | 部署到 Cloudflare                   |

Git hooks 由 [lefthook](https://lefthook.dev) 管理（`pnpm install` 时自动安装）：

- `pre-commit`：对 staged 文件执行 biome 检查 + `tsc --noEmit`
- `commit-msg`：[commitlint](https://commitlint.js.org/) 校验，遵循 conventional commits 规范

## 实现原理

- `src/index.ts` —— 请求处理：取路径第一段作为路由 key，在 `ROUTES` 中查找（解析一次后缓存在模块作用域），302 跳转到 `目标地址 + 剩余路径 + query`；未匹配的 key 返回主题化 404；`mailto:` 目标返回调起邮件客户端的页面；`/` 提供品牌首页。
- `src/html.ts` —— 所有 HTML 页面（首页、错误页、mailto 页）共用一套主题外壳：`prefers-color-scheme` 深浅色自适应、主题化 favicon、首页带 SEO meta、错误页和 mailto 页标记 `noindex`。

## License

MIT
