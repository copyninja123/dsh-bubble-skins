# dsh-bubble-skins · 气泡样式库

> 为 **DeepSeek Harness**（`dsh`）Web 界面提供多套可切换的**用户消息气泡样式**。
> 只接管气泡，不动整体主题 —— 换气泡这件事，从此像换 QQ 气泡一样简单。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![dsh](https://img.shields.io/badge/dsh-%3E%3D0.2.0-1f6feb)](https://github.com/deepseek-ai/deepseek-harness)

> 状态：**v0.2.1 已发布**；固定样式「幸运草坡」「锦鲤跃潮」「DS鲸鱼娘·白瓷蓝」均已接入；草坡/锦鲤为 42px 矮气泡，鲸鱼娘带外挂；默认仍为 DSH 原始气泡；
> 气泡尾巴 / 气泡背景 / 气泡装饰暂时隐藏，用户自定义接口后置 M3。规范见 [BUBBLE_SPEC.md](./docs/BUBBLE_SPEC.md) v3.2。

## 特性

- 🎨 **气泡独立换肤** —— 与整体主题、壁纸、字体插件解耦，互不打架；
- 🧩 **内置多套风格** —— 固定图片气泡「幸运草坡」「锦鲤跃潮」，以及 QQ 经典蓝、QQ 装饰气泡、毛玻璃、像素风、极简；
- ⚡ **热切换** —— 切换即时生效，无需重启 DSH；
- 🧹 **可完整还原** —— 卸载或停用后，产品默认外观原样回归；
- 📦 **零构建** —— 纯 JS + CSS，无打包器、无运行时依赖；
- 🌗 **明暗自适应** —— 每套皮肤同时定义亮色与暗色变体；
- 🐾 **尾巴可开关（暂时隐藏）** —— 尾巴功能已实现但当前版本不显示设置、不渲染；后续再开放；
- 🖼️ **固定图片气泡样式（M2）** —— 默认仍为 DSH 原始气泡；「幸运草坡」「锦鲤跃潮」「DS鲸鱼娘·白瓷蓝」作为可选固定样式加入下拉，随时可切回 DSH 默认，无需停用插件。

## 内置皮肤

| 皮肤 id | 名称 | 风格 |
| --- | --- | --- |
| `dsh-default` | DSH 默认（默认） | DSH 原始气泡外观；不注入气泡样式 |
| `bubble-clover-meadow` | 幸运草坡 | 浅绿草坡 + 左下三叶草 + 右下四叶草，无描边 |
| `bubble-koi-rising` | 锦鲤跃潮 | 红橙黄渐变 + 蓝色海浪 + 右下双锦鲤，无描边 |
| `bubble-ds-whale-girl` | DS鲸鱼娘·白瓷蓝 | 白瓷蓝带尾壳体 + 右下外挂鲸鱼娘角色 |
| `qq-blue` | QQ 经典蓝 | 浅蓝底 + 右侧气泡小尾巴（尾巴功能暂隐藏） |
| `qq-deco` | QQ 装饰气泡 | 深色渐变 + 两侧装饰角（尾巴功能暂隐藏） |
| `glass` | 毛玻璃 | 半透明磨砂 + 细边框 |
| `pixel` | 像素风 | 直角 + 硬阴影 + 等宽字体 |
| `minimal` | 极简 | 去底色，只留文字与细分隔线 |

> 默认是「DSH 默认」，不想用插件气泡时切回它即可，无需卸载。其余皮肤均为可选项；当前版本**不显示尾巴设置**，尾巴也不会渲染。

### 固定样式样例

<table>
  <tr>
    <td align="center" width="33%">
      <img src="./assets/styles/bubble-clover-meadow/preview.png" alt="幸运草坡" /><br />
      <sub><b>幸运草坡</b> · bubble-clover-meadow</sub>
    </td>
    <td align="center" width="33%">
      <img src="./assets/styles/bubble-koi-rising/preview.png" alt="锦鲤跃潮" /><br />
      <sub><b>锦鲤跃潮</b> · bubble-koi-rising</sub>
    </td>
    <td align="center" width="33%">
      <img src="./assets/styles/bubble-ds-whale-girl/preview.png" alt="DS鲸鱼娘·白瓷蓝" /><br />
      <sub><b>DS鲸鱼娘·白瓷蓝</b> · bubble-ds-whale-girl</sub>
    </td>
  </tr>
</table>

### 效果预览

<table>
  <tr>
    <td align="center"><img src="./assets/screenshots/qq-blue.png" width="140" alt="QQ 经典蓝" /><br /><sub><b>QQ 经典蓝</b> · qq-blue</sub></td>
    <td align="center"><img src="./assets/screenshots/qq-deco.png" width="140" alt="QQ 装饰气泡" /><br /><sub><b>QQ 装饰气泡</b> · qq-deco</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="./assets/screenshots/glass.png" width="140" alt="毛玻璃" /><br /><sub><b>毛玻璃</b> · glass</sub></td>
    <td align="center"><img src="./assets/screenshots/pixel.png" width="140" alt="像素风" /><br /><sub><b>像素风</b> · pixel</sub></td>
  </tr>
</table>

> 截图来自真机（浅色主题）；「极简」样式可在 **设置 → 通用 → 气泡样式** 中查看。
> 尾巴设置与渲染当前暂时隐藏；默认使用幸运草坡，不显示尾巴。

## 安装

要求：**dsh >= 0.2.0**（本机验证基线：桌面端 `0.2.1-rc.2`）。

桌面端推荐通过应用内「插件」页安装：

1. 打开侧边栏「**插件**」→「添加插件」；
2. 输入本地目录绝对路径（如 `E:\mycode\dsh-bubble-skins`），或发布后的包名 `dsh-bubble-skins`；
3. 安装完成后按提示启用，**重启应用**（或刷新界面）即可看到效果。

命令行方式（`dsh` 版本需与目标应用一致；profile 名请按实际环境替换，例如 `desktop` 或 `web`）：

```sh
# 本地开发安装（link 模式，改动实时生效）
dsh plugin --profile <profile> add link:E:\mycode\dsh-bubble-skins

# 卸载
dsh plugin --profile <profile> remove dsh-bubble-skins
```

> 注意：桌面端 profile 由应用自己持有，某些环境下全局 `dsh` CLI 无法管理它；
> 此时请使用应用内插件页。

## 使用

安装并**重启应用**后，在 **设置 → 通用** 里可以：

- **气泡样式**：下拉默认 **DSH 默认**；可切换「幸运草坡」等固定样式或其他皮肤，选中即生效并自动保存；
- **气泡尾巴 / 气泡背景 / 气泡装饰**：当前版本**暂时隐藏**，不显示这些设置行。

> M2 固定气泡样式已接入「幸运草坡」「锦鲤跃潮」；默认仍是 DSH 原始气泡，后续会继续增加固定样式，暂不开放用户上传入口。

### M2 路线：固定气泡样式（幸运草坡、锦鲤跃潮、DS鲸鱼娘已加入下拉）

之前的「用户自定义图片」分层实验暂缓。原因：用户素材质量、切片参数、内边距、文字避让、存储配额等问题太多，不适合作为第一个可用版本。

现在改为**固定样式优先**：

```text
作者制作素材包（背景 + 可选挂件）
        ↓
每套独立参数：slice / borderWidth / padding / textColor / tailColor
        ↓
运行时组装成固定样式，用户直接选用
        ↓
发布 3 套固定样式，先让用户有的用；后续继续增加
        ↓
最后再开放用户自定义接口
```

固定样式素材包结构：

```text
bubble-<id>/
├── manifest.json      # 样式参数（切片/内边距/文字色/尾巴色/挂件）
├── background.svg     # 九宫格背景
├── accessories/       # 可选：挂件单独拆分
├── preview.png        # 整体效果图（仅预览，不运行时）
└── README.md          # 来源/授权/制作说明
```

示例素材包：[style-package-example](./assets/templates/style-package-example/)（格式演示，不发布）。
完整内部制作规范见 **[BUBBLE_SPEC.md](./docs/BUBBLE_SPEC.md) v3.2**。

![固定气泡素材包示例](./assets/templates/style-package-example/preview.png)

### 实验功能（不进入发布）

当前源码里仍保留 v2「用户上传背景 + 装饰」的实验代码：

- 默认不作为正式功能提供；
- 已有本地数据不删除；
- 等固定样式引擎稳定后，再作为 M3 自定义接口重新设计/开放。

### 气泡素材规范

- **固定样式**：M2 按 `docs/BUBBLE_SPEC.md` v3.2 制作；逻辑气泡 **525×42**（@2x 源图 1050×84）；实际宽度由内容决定、最大约 525；单行文字目标 42px，文字区上下留白一致；
- **实验分层素材**：已归档到 `assets/recycle/bubbles/`（不随插件发布）；后续正式素材放 `assets/styles/`；
- 完整检查清单、manifest 字段、挂件拆分规则见规范文档。

也可以打开浏览器控制台切换（M1 起保留的调试能力）：

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

1. **注入作用域样式** —— 生成皮肤 CSS 时给**每一条规则**加上
   `html[data-dsh-bubble-skin="<id>"]` 前缀，覆盖形状、底色、尾巴、装饰与间距；
2. **限定命中范围** —— 只命中普通用户行、pending steering 与本地提交回声三类气泡，
   不会影响 goal 气泡、问答气泡或助手消息。

`<style>` 带 `data-plugin="dsh-bubble-skins"` 归属标记；所有资源（style 标签、根属性）都通过
`ctx.effect` 托管，插件卸载时自动清理并恢复默认外观。

> 实现细节与 DOM 钩子见 [设计文档](./docs/DESIGN.md)。

## 目录结构

```
dsh-bubble-skins/
├── package.json          # 插件清单：dsh.client / dsh.bundle.patch / icon
├── cordis.patch.yml      # 安装时向 profile 插入插件行
├── index.js              # 宿主半边（空实现，样式全部在客户端）
├── client.js             # 客户端 bundle：皮肤注册表 + 运行时（M1 核心）
├── locale/               # 中英文展示文案与皮肤文案
├── src/                  # 源码留档 / M2 皮肤模块预留
├── assets/               # 素材库（见 assets/README.md）
│   ├── styles/           # M2 正式固定样式素材包
│   ├── templates/        # 固定样式素材包示例 + legacy 留档
│   ├── recycle/          # 回收站（已废弃素材，不随插件发布）
│   └── screenshots/      # 效果预览图（README 引用）
├── docs/
│   ├── BUBBLE_SPEC.md    # 固定气泡样式内部制作规范 v3.2（素材包/参数/组装）
│   ├── DESIGN.md         # 项目设计文档
│   └── TECH_ROADMAP.md   # 技术路线文档
├── icon.svg
└── LICENSE
```

## 开发

```sh
# 语法检查
npm run check

# 本地安装（方式见上方「安装」；会写入所选 profile，可用插件页或 remove 撤销）
dsh plugin --profile <profile> add link:<本仓库绝对路径>
```

开发约束：

- 只在 `apply(ctx)` 内注册资源（`ctx.effect` / `ctx.on`），并返回清理函数；
- 不替换应用根节点、不向 `document.body` 追加第二个应用；
- **每条样式规则**都必须限定在 `html[data-dsh-bubble-skin="<id>"]` 作用域内，
  不允许整段拼接导致作用域只覆盖第一条规则；
- 选择器必须限定在用户气泡范围（`data-chat-flow-kind="user"` / `data-pending-steering` /
  `data-submission-echo` 三组并集），并使用精确后缀 `[class$="_bubble"]`；
  不要用 `[class*="_bubble"]`（会误伤 Tooltip 的 `_bubble_12mhf_1`）；
- 文本走 Client locale（`locale/zh.json`、`locale/en.json`，格式为 `{"meta":{...}}`）。

## 兼容性

| DSH 版本 | 状态 |
| --- | --- |
| `0.2.1-rc.2` | ✅ 开发与验证基线 |
| `0.2.0+` | ✅ 预计支持（需回归；`0.2.0-rc.*` 不在 `engines` 范围内） |
| `0.1.x` | ❌ 不支持（旧版无 0.2 客户端插件契约） |

## 路线图

| 阶段 | 内容 |
| --- | --- |
| M1 | 纯 CSS 皮肤库：内置皮肤 + 运行时 + 还原（已通过真机验收） |
| M1.1 | 设置面板：气泡样式下拉 + 气泡尾巴开关（已通过真机验收） |
| M2 | 固定图片气泡样式：默认 DSH 原始气泡；「幸运草坡」「锦鲤跃潮」「DS鲸鱼娘·白瓷蓝」已加入下拉；v0.2.1 已发布；DSH 真机回归待补 |
| M3 | 用户自定义接口：素材上传、导入导出、开放格式（后置） |
| M4 | 「自绘行」进阶皮肤（头像/昵称/动态尖角） |

详见 [技术路线文档](./docs/TECH_ROADMAP.md)。

## 许可证

[MIT](./LICENSE) © 2026 copyninja123


