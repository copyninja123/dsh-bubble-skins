# 气泡样式库 · 技术路线文档

> 项目代号：`dsh-bubble-skins`
> 文档版本：v1.0（2026-10-19）
> 定位：从 M1 骨架到 1.0 稳定版的技术演进计划

---

## 1. 版本策略

采用「里程碑版本号」，M 阶段对应 minor 版本递增，1.0 表示皮肤开放格式稳定。

| 版本 | 对应阶段 | 内容 | 兼容承诺 |
| --- | --- | --- | --- |
| `0.1.x` | M1 / M1.1 | 纯 CSS 皮肤库 + 设置面板 | 内部迭代，接口可变 |
| `0.2.x` | M2 | 自定义图片气泡、导入导出、开放格式草案 | 皮肤格式冻结前不承诺 |
| `0.3.x` | M3 | 自绘行进阶皮肤 | 实验性 |
| `1.0.0` | 稳定版 | 皮肤格式冻结、API 稳定 | 语义化版本 |

## 2. 里程碑

### M1 · 纯 CSS 皮肤库（当前）

| 项 | 内容 |
| --- | --- |
| 范围 | 5 套内置皮肤、运行时、持久化、还原 |
| 交付物 | `client.js` 运行时；`package.json` / `cordis.patch.yml`；README |
| 验收标准 | ① 能通过 link 安装到 web profile；② 默认皮肤生效；③ 控制台可切换且即时生效；④ 卸载后完全还原；⑤ `node --check` 通过 |
| 估时 | 1 天（骨架已完成，待补效果验证） |

### M1.1 · 设置面板

| 项 | 内容 |
| --- | --- |
| 范围 | 设置页入口、卡片列表、实时预览、恢复默认、配置持久化 |
| 交付物 | 设置行组件（`ctx.configForms`）、locale 文案、配置 schema |
| 验收标准 | ① 设置页可见「气泡样式」；② 点击即时切换；③ 重启后保持；④ 恢复默认可用 |
| 技术依赖 | 0.2 的 `configForms.get(namespace)` + `set(field, value)`；设置行需注册为 volatile 字段 |
| 估时 | 1–2 天 |

### M2 · 自定义与开放

| 项 | 内容 |
| --- | --- |
| 范围 | 图片气泡、`.dsbubble` 导入导出、第三方皮肤注册接口、助手气泡 |
| 交付物 | 资源管线（压缩/data URI/体积校验）、导入校验器、公开 API |
| 验收标准 | ① 上传图片生成气泡并持久化；② 导出文件可被他人导入；③ 第三方插件能注册皮肤；④ 助手气泡可独立配置 |
| 关键约束 | 图片必须内联 data URI（`/plugins/` 只服务 `client*.js`），或经 Host 侧 `ctx.webServer.register` 提供路由 |
| 估时 | 2–3 天 |

### M3 · 自绘行（进阶）

| 项 | 内容 |
| --- | --- |
| 范围 | 遮罩 `conversation.chat.node`（key `user`，priority `-1`）自绘整行 |
| 交付物 | 自绘渲染器：头像、昵称、动态尖角、按消息类型差异化 |
| 验收标准 | ① 不影响默认用户（未开启时）；② 附件/引用/pending/echo 行为完整；③ 可一键回到 M1 皮肤 |
| 关键约束 | 必须复刻附件、引用、悬停操作、pending、submission echo、无障碍语义 |
| 估时 | 2–4 天 |

## 3. 技术演进路径

```
M1/M1.1           M2                    M3
纯 CSS 皮肤  →  图片皮肤 + 开放格式  →  自绘行（可选）
（零侵入）      （半侵入：资源管线）     （完全接管行渲染）
```

| 方案 | 能力 | 侵入度 | 何时采用 |
| --- | --- | --- | --- |
| A. 纯 CSS | 颜色/形状/底图/装饰 | 零（只加样式） | M1 起默认 |
| B. 遮罩 keyed 插槽 | 完全自绘整行 | 中（接管渲染） | M3 作为「进阶皮肤」 |
| C. 仅 token | 颜色/圆角 | 零 | 降级兜底 |

**原则**：A 能覆盖的需求绝不上 B；B 必须做成可开关的独立皮肤，不影响 A 档用户。

## 4. 关键技术结论（已确认）

### 4.1 气泡渲染结构（dsh 0.2.1-rc.2）

| 项 | 结论 |
| --- | --- |
| 前端包 | `@deepseek-ai/dsh-client-ui-chat` |
| 组件链 | `ChatView` → 行容器（`data-chat-flow-kind`）→ `SlotOutlet` → `UserStyleBubble` → `UserContent` → `div.bubble` |
| 气泡本体 | 单个 `div`，CSS Modules 类名以 `_bubble` 结尾（全客户端唯一） |
| 稳定钩子 | `[data-chat-flow-kind="user"]`、`[class*="_bubble"]`、`[data-slot="conversation.chat.node"]` |

### 4.2 插件机制边界

| 能做 | 不能做 |
| --- | --- |
| `ctx.effect` 注入 `<style>`、`theme.overrideTokens` | 替换官方 factory 插槽（重复注册直接抛错） |
| `ctx.slots.register/inject` | 直接 require 宿主 UI 包 |
| 低 priority 遮罩同 key 条目（keyed 插槽） | 从 `/plugins/` 加载图片/字体 |
| Host 侧 `ctx.webServer.register` 提供资源 | — |

### 4.3 选型结论

- M1 采用 **A（纯 CSS）**：约 150–300 行、无需构建、风险最低；
- 参考图（会员装饰气泡）的复杂位图素材，走 M2 图片皮肤，不用 CSS 硬画；
- 完整「QQ 皮肤」（头像/昵称）必须走 M3，M1/M2 不做承诺。

## 5. 测试策略

### 5.1 冒烟清单（每次发版必过）

| # | 检查项 | 通过标准 |
| --- | --- | --- |
| 1 | 安装 | `dsh plugin --profile web add link:<repo>` 成功 |
| 2 | 加载 | Web 刷新后无控制台报错 |
| 3 | 默认皮肤 | 气泡变为浅蓝 + 尾巴 |
| 4 | 切换 | `window.dshBubbleSkins.set('glass')` 即时生效 |
| 5 | 持久化 | 刷新后保持所选皮肤 |
| 6 | 明暗 | 切换 system/light/dark 均正常 |
| 7 | 还原 | remove 插件后外观完全恢复 |
| 8 | 语法 | `npm run check` 通过 |

### 5.2 回归矩阵

| 维度 | 取值 |
| --- | --- |
| dsh 版本 | 0.2.0 / 0.2.1-rc.2 / 最新 nightly |
| 主题 | light / dark / system |
| 消息类型 | 纯文本 / 带附件 / 带引用 / pending steering / submission echo |
| 共存插件 | 无 / 已装换肤类插件（验证优先级） |

## 6. 发布流程

```
开发 → npm run check → 本地 link 安装验证 → 打 tag
     → npm publish → gh release create → 验证 dsh plugin add 安装
```

| 步骤 | 命令 | 说明 |
| --- | --- | --- |
| 语法检查 | `npm run check` | 发版前必须通过 |
| 本地验证 | `dsh plugin --profile web add link:.` | 冒烟清单全过 |
| 版本号 | `npm version patch/minor` | 遵循语义化版本 |
| 发布 npm | `npm publish` | 包名 `dsh-bubble-skins` |
| GitHub 发布 | `gh release create vX.Y.Z --generate-notes` | 附变更说明 |
| 安装验证 | `dsh plugin --profile web add dsh-bubble-skins` | 从 npm 全新安装 |

## 7. 兼容性矩阵

| dsh 版本 | 状态 | 备注 |
| --- | --- | --- |
| `0.2.0` | ✅ | 最低支持版本 |
| `0.2.1-rc.2` | ✅ | 开发基线 |
| `0.1.x` | ❌ | 缺少 0.2 的设置/配置契约 |
| 未来 0.3.x | ⚠️ | 需回归 DOM 钩子与插件 API |

## 8. 维护计划

| 事项 | 频率 | 动作 |
| --- | --- | --- |
| DSH 升级适配 | 跟随 nightly | 跑冒烟清单，检查 `_bubble` 类与 `data-chat-flow-kind` |
| issue 响应 | 持续 | 模板：环境信息 + 截图 + 控制台报错 |
| 皮肤征集 | M2 后 | 开放 PR 目录 `src/skins/` |
| 依赖更新 | 按需 | 当前零运行时依赖，无更新压力 |

## 9. 风险登记表

| id | 风险 | 概率 | 影响 | 应对 | 状态 |
| --- | --- | --- | --- | --- | --- |
| R1 | DSH 改动气泡类名 | 中 | 样式失效 | 后缀匹配 + 快速适配发版 | 监控 |
| R2 | 插件 API 变更 | 低 | 加载失败 | 版本矩阵 + 兼容层 | 监控 |
| R3 | 与换肤插件冲突 | 中 | 视觉异常 | 作用域 + 文档说明 | 缓解中 |
| R4 | 自定义图片性能 | 中 | 卡顿 | 压缩 + 体积上限 | 待 M2 |
| R5 | 官方收紧 DOM 注入 | 低 | 方案受限 | 保留 token 降级路径 | 监控 |
