# DS鲸鱼娘·白瓷蓝 · 一体带尾气泡

状态：用户已确认定稿。日期：2026-10-22；**已接入插件源码，并随 v0.2.1 发布；DSH 真机验收待补**。

## 本轮的结构变化

background.svg只有一条可见、闭合的path：轮廓从圆角气泡直接连到小尾巴，再返回气泡下缘。气泡和尾巴共用同一片填色与同一圈描边，根部没有横向接缝线。

不再使用独立尾巴SVG、尾巴图层、白色遮缝盖片或::after。角色仍是独立的短颈透明挂件，位于整个带尾气泡后方，由气泡右下角自然遮挡。

用户本轮明确要求将尾巴画入完整壳体，本款据此替换原规范中“尾巴单独绘制”的做法；不把此款特殊设计误写为所有样式的通用规则。

## 文件与尺寸

| 文件 | 内容 |
| --- | --- |
| background.svg | 原生纯矢量、单一路径带尾壳体，**1050×108**，其中正文区域1050×84，尾巴区域向下扩展24源图单位 |
| manifest.json | 更新切片与绘制宽度，角色仍在气泡下层 |
| accessories/br-whale-girl@2x.png | 上轮短颈角色，76×80像素，显示38×40 CSS px，图像内容不变 |
| preview.png | 完整单行组合1078×124，逻辑539×62，包含角色右探14/下探20 |
| preview-short.png | “大家好！”的完整短句效果 |
| preview-base.png | 完整带尾壳体预览1050×108，不含角色；没有裁断尾巴，不再误标成1050×84 |
| README.md | 结构变化、绘制范围、验证与来源 |

正文区域仍按525×42设计，14px字体、22px行高、上下各10px；尾巴不参与文字布局。单行正文42px、带尾壳体54px、含角色的组合62px，这三个高度分别记录。

## 配置与组装要求

| 参数 | 值 |
| --- | --- |
| slice（源图，上右下左） | [30,80,52,30] |
| borderWidth / borderImageWidth（CSS px） | [15,40,26,15] |
| padding（CSS px） | [10,36,10,16] |
| textColor / textShadow | #1E2D55 / none |
| 角色 | br，38×40，offsetX=-14、offsetY=-20、zIndex=-2 |

为了把带尾SVG完整画出，同时保持正文42px，预览的背景层覆盖范围为 `inset:0 0 -12px 0`，不是把54px壳体压缩进42px文字盒。

**已按本 README 的组装规则接入插件源码：`::before` 使用 `inset:0 0 -12px 0` 绘制带尾壳体，`::after` 放置右下外挂角色，并停用原有独立尾巴。** 不能只替换图片、仍沿用 `inset:0`，否则会把壳体和尾巴压缩或画错位置。

预览核心规则如下（角色定位基准仍是正文气泡）：

```css
.bubble { position: relative; isolation: isolate; padding: 10px 36px 10px 16px; font-size: 14px; line-height: 22px; }
.bubble::before {
  content: ''; position: absolute; inset: 0 0 -12px 0; z-index: -1;
  border-style: solid; border-color: transparent; border-width: 15px 40px 26px 15px;
  border-image-source: url(background.svg); border-image-slice: 30 80 52 30 fill;
  border-image-width: 15px 40px 26px 15px; border-image-repeat: stretch;
}
.girl { position: absolute; right: -14px; bottom: -20px; width: 38px; height: 40px; z-index: -2; }
```

这里没有用于画尾巴的::after。气泡及祖先需要允许挂件外露，实际宿主overflow仍待验证。

## 验证范围

- XML结构检查：SVG只有1条path，且以Z闭合；无独立尾巴或遮缝图形。
- 组装器检查：不存在::after尾巴规则，背景和尾巴只作为一张SVG九宫格绘制。
- 已查看短句及连接处放大图，尾巴轮廓与壳体自然相连，气泡内部没有接缝描线。
- Chrome实测单字66×42、窄字符55.375×42、两行94×64、三行94×86；连续200字符英文无文字溢出。
- 角色保持38×40、右探14/下探20，短/长/多行与明暗环境尺寸稳定；短颈图像内容未变。
- 实际每行文字矩形覆盖的146832个背景像素最低对比度约13.11:1。
- 未做DSH真机验证；背景绘制范围、独立尾巴停用、实际层级、祖先overflow和相邻消息间距需接入时同步核对。

## 来源与旧稿

带尾壳体为本轮原创单一路径SVG；角色复用上轮已修改的短颈透明图像。本轮没有重新生成或改变角色像素。角色最初参考用户指定的QQ“DS鲸鱼娘”截图重绘，参考原作者和授权未由用户提供，未宣称官方认可或执行发布。

用户已确认当前一体带尾版定稿；各轮旧稿、独立尾巴旧源稿、生成原图和中间文件已清理。保留本素材包及Figma定稿源稿。

## Figma

一体壳体源稿：https://www.figma.com/design/HYVU19YDFqpKIh1jtB6G44?node-id=15-2

分层源稿：https://www.figma.com/design/HYVU19YDFqpKIh1jtB6G44?node-id=15-4

定稿预览页：https://www.figma.com/design/HYVU19YDFqpKIh1jtB6G44?node-id=15-8

