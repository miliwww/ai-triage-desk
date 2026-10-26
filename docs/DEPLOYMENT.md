# 打包与部署

GitHub 账号、仓库名和可见性由用户后续决定。本轮没有创建远程仓库、推送代码或发布公开网站。

## 本地交付

```bash
npm ci
npm run release
npm run preview
```

预览地址：`http://127.0.0.1:4173/#/dashboard`。

`releases/` 中生成：

- `alphaess-service-desk-demo-v0.1.0-source.zip`：源码、锁文件、模拟数据、测试、截图与说明。
- `alphaess-service-desk-demo-v0.1.0-static.zip`：编译后的可部署静态资源。
- `SHA256SUMS.txt`：两个包的校验值。

静态包需由 HTTP 服务提供，直接双击 HTML 无法可靠加载 JSON。解压后进入包含 `index.html` 的目录，可使用 `python -m http.server 4173 --bind 127.0.0.1`，再访问上述预览地址。

源码包排除 node_modules、构建缓存、编辑器个人配置、本地技能、Python 缓存、私密环境文件和个人讨论/求职材料；完整目录中的原材料保留。本包暂未选择开源许可证，见 `NOTICE.md`。

## 路由与资源

`build:pages` 使用相对资源基础路径 `./`，应用使用 Hash 路由。示例详情路径：`/#/tickets/WO-0047?tab=review`。

部署到项目子目录时，形式为 `/仓库名/#/tickets/WO-0047?tab=review`。浏览器实际请求项目根目录中的 HTML，Hash 后的路由由客户端处理，不需要服务器提供详情路径回退。静态包中的 `data/` 必须与 `index.html` 一起部署。

## GitHub 发布时再做

1. 确定账号、仓库名、公开范围与材料公开范围。
2. 将源码提交并推送到目标仓库，等待 `Verify demo` 工作流完成测试、数据校验与构建。
3. 如需在线演示，在仓库 Settings → Pages 中选择 GitHub Actions。
4. 在 Actions 中手动运行 `Publish demo to Pages`。
5. 打开部署结果，验证首页、两个案例、直接分享链接、刷新、数据请求和控制台，再把真实地址写入 README 与仓库 About。

部署工作流仅允许手动触发；普通推送会运行验证，不会自动公开网站。部署步骤参考 [GitHub 官方自定义 Pages 工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。在真实远程运行成功前，只能称为配置已准备，不能称为已部署。

## 发布前后的变化

纯静态演示没有模型密钥与后端配置。若后续加入模型或服务端，需要重新确定运行环境、密钥管理、请求限制、持久化和部署流程，当前静态发布方案不会自动覆盖这些能力。
