# dsh-bubble-skins · 气泡样式库

> 为 **DeepSeek Harness**（`dsh`）Web 界面提供多套可切换的**用户消息气泡样式**。
> 只接管气泡，不动整体主题 —— 换气泡这件事，从此像换 QQ 气泡一样简单。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![dsh](https://img.shields.io/badge/dsh-%3E%3D0.2.0-1f6feb)](https://github.com/deepseek-ai/deepseek-harness)

> 状态：**M1 骨架已完成**（可安装、可切换、可还原），设置面板与自定义皮肤见 [路线图](./docs/TECH_ROADMAP.md)。

## 特性

- 🎨 **气泡独立换肤** —— 与整体主题、壁纸、字体插件解耦，互不打架；
- 🧩 **内置多套风格** —— QQ 经典蓝、QQ 装饰气泡、毛玻璃、像素风、极简；
- ⚡ **热切换** —— 切换即时生效，无需重启 DSH；
- 🧹 **可完整还原** —— 卸载或停用后，产品默认外观原样回归；
- 📦 **零构建** —— 纯 JS + CSS，无打包器、无运行时依赖；
- 🌗 **明暗自适应** —— 每套皮肤同时定义亮色与暗色变体。

## 内置皮肤

| 皮肤 id | 名称 | 风格 |
| --- | --- | --- |
| `qq-blue` | QQ 经典蓝 | 浅蓝底 + 右侧气泡小尾巴 |
| `qq-deco` | QQ 装饰气泡 | 深色渐变 + 两侧装饰角（参考会员气泡） |
| `glass` | 毛玻璃 | 半透明磨砂 + 细边框 |
| `pixel` | 像素风 | 直角 + 硬阴影 + 等宽字体 |
| `minimal` | 极简 | 去底色，只留文字与细分隔线 |

> 效果预览图待补（见路线图 M1 验收项）。

## 安装

要求：**dsh >= 0.2.0**。

```sh
# 从 npm 安装（发布后可用）
dsh plugin --profile web add dsh-bubble-skins

# 从本地开发目录安装（link 模式，改动实时生效）
dsh plugin --profile web add link:E:\mycode\dsh-bubble-skins
```

卸载：

```sh
dsh plugin --profile web remove dsh-bubble-skins
```

## 使用

安装后默认启用 `qq-blue` 皮肤，刷新 Web 界面即可看到效果。

M1 阶段通过浏览器控制台切换（设置面板在 M1.1 接入）：

```js
// 查看可用皮肤
window.dshBubbleSkins.list

// 切换皮肤（立即生效并持久化）
window.dshBubbleSkins.set('glass')

// 查看当前皮肤
window.dshBubbleSkins.current
```

## 工作原理

本插件只做两件事，全部在客户端完成：

1. **覆盖气泡语义 token** —— 通过作用域 CSS 覆盖 `--dsw-specific-bubble` 等变量；
2. **注入作用域样式** —— 形状、尾巴、装饰、间距等规则统一挂在
   `html[data-dsh-bubble-skin="<id>"]` 之下，用 `[class*="_bubble"]` 命中气泡本体。

所有资源（style 标签、根属性）都通过 `ctx.effect` 托管，插件卸载时自动清理。

> 实现细节与 DOM 钩子见 [设计文档](./docs/DESIGN.md)。

## 目录结构

```
dsh-bubble-skins/
├── package.json          # 插件清单：dsh.client / dsh.bundle.patch / icon
├── cordis.patch.yml      # 安装时向 profile 插入插件行
├── index.js              # 宿主半边（空实现，样式全部在客户端）
├── client.js             # 客户端 bundle：皮肤注册表 + 运行时（M1 核心）
├── locale/               # 中英文展示文案
├── src/                  # 源码留档 / M2 皮肤模块预留
├── docs/
│   ├── DESIGN.md         # 项目设计文档
│   └── TECH_ROADMAP.md   # 技术路线文档
├── icon.svg
└── LICENSE
```

## 开发

```sh
# 语法检查
npm run check

# 本地安装到 web profile（会修改 ~/.dsh/profiles/web，可用 remove 撤销）
dsh plugin --profile web add link:<本仓库绝对路径>
```

开发约束：

- 只在 `apply(ctx)` 内注册资源（`ctx.effect` / `ctx.on`），并返回清理函数；
- 不替换应用根节点、不向 `document.body` 追加第二个应用；
- 所有新样式必须限定在 `html[data-dsh-bubble-skin="<id>"]` 作用域内；
- 文本走 Client locale（`locale/zh.json`、`locale/en.json`）。

## 兼容性

| DSH 版本 | 状态 |
| --- | --- |
| `0.2.x` | ✅ 支持（开发基线 0.2.1-rc.2） |
| `0.1.x` | ❌ 不支持（旧版无 `configForms` 等 0.2 契约） |

## 路线图

| 阶段 | 内容 |
| --- | --- |
| M1 | 纯 CSS 皮肤库：内置皮肤 + 运行时 + 还原（当前） |
| M1.1 | 设置面板「设置 → 外观 → 气泡样式」，可视化切换与微调 |
| M2 | 自定义图片气泡、皮肤包导入导出、开放皮肤格式 |
| M3 | 「自绘行」进阶皮肤（头像/昵称/动态尖角） |

详见 [技术路线文档](./docs/TECH_ROADMAP.md)。

## 许可证

[MIT](./LICENSE) © 2026 copyninja123
