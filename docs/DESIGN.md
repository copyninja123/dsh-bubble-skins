# 气泡样式库 · 项目设计文档

> 项目代号：`dsh-bubble-skins`
> 文档版本：v1.0（2026-10-19）
> 适用对象：项目维护者、贡献者、插件使用者

---

## 1. 背景与问题

DeepSeek Harness（`dsh`）的 Web 界面默认只有一套用户消息气泡：浅色圆角块。
社区里的皮肤插件（如整站换肤类）通常**同时**接管背景、侧边栏、按钮、气泡等全部视觉元素，
导致两个问题：

1. **粒度太粗** —— 只想换气泡的用户被迫接受整套皮肤；
2. **互相冲突** —— 多套皮肤插件同时启用时，气泡样式被反复覆盖。

因此需要一个**只负责气泡**、可独立切换、可完整还原的插件。

## 2. 目标与非目标

### 2.1 目标

| # | 目标 | 说明 |
| --- | --- | --- |
| G1 | 气泡可独立换肤 | 不依赖、不接管整体主题 |
| G2 | 多套内置风格 | M1 提供 5 套，覆盖主流审美 |
| G3 | 即时生效 | 切换无需重启 DSH |
| G4 | 完整还原 | 停用/卸载后恢复产品默认外观 |
| G5 | 可扩展 | 皮肤格式清晰，M2 起开放给第三方 |
| G6 | 明暗自适应 | 每套皮肤同时定义亮/暗变体 |

### 2.2 非目标

| # | 非目标 | 原因 |
| --- | --- | --- |
| N1 | 修改助手消息样式 | M1 范围外；助手节点结构更复杂（Think/工具行） |
| N2 | 接管整体主题 | 与换肤类插件定位冲突 |
| N3 | 修改消息 DOM 结构 | 纯 CSS 路线，零侵入 |
| N4 | 支持 dsh < 0.2.0 | 旧版缺少 0.2 的设置/配置契约 |
| N5 | 气泡内头像/昵称 | 用户气泡 DOM 中没有这些槽位（M3 才考虑自绘行） |

## 3. 设计原则

1. **最小侵入**：只注入样式，不改组件、不换插槽、不动应用根节点。
2. **作用域隔离**：所有规则挂在 `html[data-dsh-bubble-skin="<id>"]` 下，皮肤之间互不污染。
3. **声明式皮肤**：一套皮肤 = 一份 token 覆盖 + 一段作用域 CSS，数据驱动，不写运行时代码。
4. **可逆**：任何挂载都必须有对应的清理路径，卸载后不残留。
5. **版本防御**：选择器使用后缀匹配与 `data-*` 钩子，尽量不依赖构建哈希。

## 4. 用户场景

| 场景 | 描述 | 期望 |
| --- | --- | --- |
| S1 快速换肤 | 用户想试试不同气泡风格 | 设置里点一下即可预览，不满意可恢复 |
| S2 与主题组合 | 用户已装壁纸/毛玻璃主题 | 气泡样式只叠加在气泡上，不破坏主题 |
| S3 分享皮肤 | 用户设计了一套气泡想分享 | M2 导出 `.dsbubble` 文件，他人导入 |
| S4 卸载还原 | 用户不再需要该插件 | 停用后界面完全回到默认 |

## 5. 核心概念模型

```
官方默认气泡
   └── BubbleSkin（气泡皮肤包）        ← 同一时间只激活一个
          ├── tokens（颜色覆盖）
          └── css（形状 / 装饰）
                └── overrides（用户微调，M1.1）
```

| 概念 | 定义 |
| --- | --- |
| `BubbleSkin` | 一套气泡样式：id、名称、作用域、token 覆盖、CSS |
| `scope` | 作用范围：`user`（M1 仅支持）、`assistant`（M2 起） |
| `overrides` | 在皮肤基础上的用户微调（圆角、尾巴、颜色），单独持久化 |
| 激活态 | `html[data-dsh-bubble-skin="<id>"]` + 一份注入的 `<style>` |

## 6. 功能设计

### 6.1 M1（已完成，真机初验）

- 5 套内置皮肤；
- 默认皮肤 `qq-blue` 自动启用；
- 控制台 API 切换（`window.dshBubbleSkins`）；
- 本地持久化（`localStorage`）；
- 完整卸载还原。

### 6.2 M1.1（设置面板）

- 入口：`设置 → 通用`；
- 「气泡样式」：下拉选择 5 套皮肤，选中即应用；
- 「气泡尾巴」：独立开关（根属性 `data-dsh-bubble-tail`），对所有皮肤生效；
- 控件外观对齐 DSH 官方设置（圆角灰底 + chevron / 胶囊开关）；
- 持久化先走 `localStorage`（皮肤 + 尾巴两个键），后续可迁移 DSH 配置（`configForms`）。

### 6.3 M2（自定义与开放）

- 上传图片生成「图片气泡」（本地压缩 → data URI 或本地资源）；
- 皮肤包导入 / 导出（`.dsbubble`）；
- 开放皮肤格式，第三方可在自己的插件中注册皮肤；
- 助手气泡支持（`scope: assistant`）。

### 6.4 M3（自绘行，进阶）

- 通过**低优先级 keyed 插槽遮罩**接管 `conversation.chat.node`（key = `user`）；
- 自绘整行：头像、昵称、随内容变化的尖角、消息类型差异化皮肤；
- 需要复刻附件、引用、悬停操作、pending、submission echo 等行为。

## 7. 内置皮肤设计

| id | 视觉目标 | 技术手段 |
| --- | --- | --- |
| `qq-blue` | 浅蓝底、右侧小尾巴 | token 覆盖 + `::after` 三角 |
| `qq-deco` | 深色渐变、两侧装饰角（参考会员气泡） | 多重背景 + 双伪元素装饰 |
| `glass` | 半透明磨砂 | `backdrop-filter` + 半透明背景 |
| `pixel` | 直角、硬阴影、像素边框 | `box-shadow` 位移 + 等宽字体 |
| `minimal` | 无底色，只留文字与细线 | 透明背景 + 左边框 |

### 7.1 参考图（会员气泡）的落地路径

用户提供的参考图是 QQ 会员气泡：深色底、左右装饰角、底部图标、烟雾纹理。
纯 CSS 可以还原“深色 + 装饰角 + 渐变”的观感（`qq-deco`），
但**复杂的位图素材**（翅膀、香烟图标等）不适合用 CSS 硬画：

- M1：`qq-deco` 提供近似风格；
- M2：「图片气泡」支持整图素材（SVG/PNG data URI），即可 100% 还原参考图；
- 资源必须内联或走 Host 路由（`/plugins/` 只服务 `client*.js`）。

## 8. 技术架构

```
┌─────────────────────────────── DSH Web 客户端 ───────────────────────────────┐
│                                                                              │
│  window.__ModuleLoader__.load({ id: 'dsh-bubble-skins', factory })           │
│        │                                                                     │
│        └── apply(ctx)                                                        │
│              ├── ctx.effect(() => { mount(active); return () => unmount() }) │
│              └── window.dshBubbleSkins = { list, current, set }              │
│                                                                              │
│  <style id="dsh-bubble-skins:style">   ← 整段替换（热切换）                    │
│  <html data-dsh-bubble-skin="qq-blue"> ← 作用域根                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 8.1 双半区

| 半区 | 文件 | 职责 |
| --- | --- | --- |
| Host | `index.js` | 空实现（纯客户端插件，无需宿主能力） |
| Client | `client.js` | 皮肤注册表、CSS 生成、挂载/卸载、持久化 |

### 8.2 运行时状态机

```
[未挂载] --mount(id)--> [已挂载: style + root attr]
     ^                          |
     |                          | set(id) → 重建 style 文本（热切换）
     └------ unmount() --------┘
```

## 9. 关键技术实现

### 9.1 气泡的 DOM 钩子（0.2.1-rc.2 实测）

```html
<div data-chat-flow-kind="user" data-chat-node-key="…">
  <div data-slot="conversation.chat.node" style="display:contents">
    <div class="xxxx_userRow">
      <div class="xxxx_userStack">
        <div class="xxxx_attachmentRow">…</div>
        <div class="xxxx_bubble">纯文本</div>
        <div class="xxxx_referenceSummary">…</div>
      </div>
    </div>
  </div>
</div>
```

| 钩子 | 稳定性 | 用途 |
| --- | --- | --- |
| `[data-chat-flow-kind="user"]` | 高（官方 data 属性） | 定位用户消息行 |
| `[class$="_bubble"]` | 中（精确后缀；前缀随构建变化） | 气泡本体（必须用后缀匹配，否则会命中 Tooltip 的 `_bubble_12mhf_1`） |
| `[data-slot="conversation.chat.node"]` | 高（插槽锚点） | 行级容器（`display: contents`，不适合设宽高） |
| `[data-pending-steering]` / `[data-submission-echo]` | 高 | pending steering / 本地回声；**它们没有 flow-kind 行容器** |

> 注意：`conversation.chat.user.content`、`conversation.user.text` 是 Factory 插槽，
> 不产生 DOM 锚点；不要用 `[data-slot="conversation.user.text"]` 选择文字。

### 9.2 样式注入策略

- 注入位置：`document.head`，单个带 `data-plugin="dsh-bubble-skins"` 归属标记的 `<style>`，整段替换实现热切换；
- 作用域：**逐条规则**加 `html[data-dsh-bubble-skin="<id>"]` 前缀，绝不整段拼接；
- 命中范围：`[data-chat-flow-kind="user"]` / `[data-pending-steering]` / `[data-submission-echo]`
  三组并集下的 `[class$="_bubble"]`（精确后缀，排除 Tooltip 的 `_bubble_12mhf_1`），避免误伤 goal、问答等组件；
- 双色：暗色规则使用 `body[data-ds-dark-theme]`（存在性选择器，不能写 `="true"`），随主题切换自动生效；
- 还原：卸载时移除本插件全部 style 与根属性；复用同 id 节点并清理旧残留。

### 9.3 颜色接管方式

| 方式 | 说明 | 选用 |
| --- | --- | --- |
| 作用域 CSS | 直接覆盖气泡元素；自定义属性写在气泡/行元素上（写在 `html[data-…]` 上可能被 `body` 声明覆盖） | ✅ M1 |
| `ctx.theme.overrideTokens()` | 写入 `body` 内联变量、要求 light/dark 成对，**全局生效无法按组件隔离** | ❌ 不用于皮肤级配色 |

## 10. 皮肤包开放格式（M2 草案）

```ts
interface BubbleSkin {
  id: string;                          // 唯一 id，kebab-case
  name: { zh: string; en: string };
  description?: { zh: string; en: string };
  version?: string;
  author?: string;
  scope: ('user' | 'assistant')[];
  tokens?: Record<string, { light: string; dark: string }>;
  css: string;                         // 作用域内 CSS
  assets?: Record<string, string>;     // 仅允许 data URI
}
```

校验规则（M2 落地）：

1. `id` 不得与内置皮肤冲突；
2. `css` 中禁止出现 `@import`、`url(http…)`、`position:fixed` 覆盖全屏；
3. `assets` 单文件 ≤ 256KB，合计 ≤ 2MB；
4. 所有外链资源必须内联为 data URI。

## 11. 交互设计

| 阶段 | 入口 | 交互 |
| --- | --- | --- |
| M1 | 浏览器控制台 | `window.dshBubbleSkins.set('id')` |
| M1.1 | 设置 → 外观 → 气泡样式 | 卡片列表、点击即时预览、恢复默认 |
| M2 | 设置页 + 拖拽导入 | 上传图片、导入/导出、皮肤排序 |
| M3 | 同上 | 进阶皮肤开关 |

## 12. 兼容性与降级

| 风险 | 检测点 | 降级策略 |
| --- | --- | --- |
| 气泡类名变化 | `[class*="_bubble"]` 匹配失败 | 保留 token 层效果；控制台告警 |
| DOM 结构变化 | 用户行钩子失效 | 样式仍生效于气泡本体，不崩溃 |
| 与其他插件冲突 | 样式被覆盖 | 提高作用域特异性；文档给出共存说明 |
| 暗色属性变化 | `body[data-ds-dark-theme]` 失效 | 回落到亮色规则 |

## 13. 风险与对策

| # | 风险 | 影响 | 对策 |
| --- | --- | --- | --- |
| R1 | DSH 升级改类名 | 样式失效 | 后缀匹配 + data 钩子；版本回归测试 |
| R2 | 插件 API 变更 | 加载失败 | 锁定 0.2 契约；README 标注支持矩阵 |
| R3 | 多插件样式打架 | 视觉异常 | 作用域隔离；文档说明优先级 |
| R4 | 自定义图片过大 | 卡顿 | 上传压缩、体积上限、M2 校验 |
| R5 | 官方不推荐 DOM/样式注入 | 未来受限 | 优先使用官方 token/插槽路径；保留纯 token 降级 |

## 14. 附录

### 14.1 气泡相关 token

| token | 作用 | 亮色 / 暗色 |
| --- | --- | --- |
| `--dsw-specific-bubble` | 用户气泡底色（chat / goal / 问答气泡共用） | `#edf3fe` / `#2c2c2e` |
| `--dsw-specific-bubble-highlight` | inspector 高亮色 | `#d3e2ff` / `#43454a` |
| `--dsw-radius-xl` | 气泡默认圆角 | `20px`（无暗色变体） |
| `--dsh-content-font-size` | 气泡内容字号 | 默认 `14px`（10–22 可配） |
| `--dsh-chat-content-width` | 聊天内容宽度（外层再按 0.702 与 82% 取小） | 布局变量 |

> 前两个 token 被多个组件共用，修改会同时影响它们；皮肤级配色应写在气泡元素自身。

### 14.2 术语表

| 术语 | 含义 |
| --- | --- |
| BubbleSkin | 一套气泡皮肤定义 |
| scope | 皮肤作用范围（user / assistant） |
| 作用域根 | `html[data-dsh-bubble-skin="<id>"]` |
| 还原 | 卸载时移除全部注入资源，恢复默认外观 |
