# 锦鲤跃潮 / Rising Golden Koi · v3.2

状态：按 v3.2 规范重做，并已替换插件运行时素材；待 DSH 真机验收。日期：2026-10-22。

重新设计1050×84宽矮壳体：红橙黄渐变、顶部金色流光、连续蓝色海水和左侧卷浪；重新生成一大一小的红金绘画鲤鱼，分别置于右上与右下固定角，保留向上跃起的姿态。

## 交付

| 文件 | 用途 |
| --- | --- |
| background.svg | 1050×84透明九宫格源图，正文与尾巴不烘焙 |
| manifest.json | 独立切片、绘制宽度、文字留白与颜色 |
| preview.png | 从同一SVG和manifest经Chrome实际组装生成，525×42 CSS、DPR 2，输出1050×84透明PNG |
| README.md | 制作说明、来源和验收范围 |

Figma审批稿：[查看设计](https://www.figma.com/design/lLjJzBwwwxRFcDFYKBPl45?node-id=16-2)。无独立挂件、无可见边框、无阴影。

## 尺寸与参数

| 项目 | 值 |
| --- | --- |
| 逻辑基准 / 源图 | 525×42 / 1050×84 @2x |
| slice（源图单位，上右下左） | [40,80,36,28] |
| borderWidth / borderImageWidth（CSS px） | [20,40,18,14] |
| padding（CSS px） | [10,42,10,16] |
| textColor / textShadow | #240A05 / none |
| tailColor | #FFAE61 |
| accessories | [] |

使用14px字体、22px行高，上下padding均为10px，因此单行42px、两行64px、三行86px；不通过裁切、缩放正文或装饰额外增高。宽度随内容变化，最大约525px。

为完整保留右侧双鱼，右侧padding为42px，左侧16px；这是水平留白，不影响42px单行高度。两条鱼分别完整落在顶部40源图单位与底部36源图单位的右侧固定角内，鱼头、身体和尾巴在本款均固定；海水、渐变和顶部连续流光允许拉伸。并非要求所有装饰固定：仅对完整鱼形作美术选择。

## 验收证据

- Chrome实测源图1050×84、预览1050×84；单字、emoji单行42px，两行64px，三行86px；长英文与10行正文无横向溢出。
- 实测单字外宽72px，未强制拉成525px；预览展示最大宽单行仅供标准验收。
- 已检查普通短/长/多行及明暗环境截图；消除了最初方案在多行中将鱼身过度纵向拉长的问题。
- 以实际每行文字Range矩形取样，保持布局与全部装饰不变，仅隐藏字形，遍历文字覆盖范围内所有背景像素，得到保守最低对比度约7.46:1，达到4.5:1。不是只测源图中央空白或平均色。矩形包含字间空白，因此属于保守检查。
- 140788个背景像素取样，覆盖浅色/深色、普通短消息、最大宽单行、多行。最差背景RGB为[126,171,178]。
- 本轮使用2个子代理：草坡独立设计、v3.2验收规范复核；主代理修正短消息切片溢出，完成锦鲤设计与实际组装检查。
- 已接入插件运行时（新素材压缩为 WebP 内联 client.js）；DSH 真机仍待验收，附件、引用、pending、回声及宿主CSS待验证。

## 来源、格式与旧稿

- 本版是原生矢量渐变/流光与内嵌位图的混合SVG，不是纯矢量；不依赖外部PNG文件。海水与卷浪复用此前用户认可的绘画素材，并按部件重新组装，非直接把720×240整图压扁成1050×84。
- 双鱼使用内置图像生成工具重新生成透明素材，再按各自固定角显示尺寸导出。风格参考为用户提供的codex-clipboard-e30fbd11-73b1-4332-8595-7b49d9225880.png；未拷贝原图文字或直接贴参考图像素。参考图原作者和授权未提供，不擅自补写。尚未发布。
- 预览使用本机系统字体，没有打包字体文件。
- 旧版 720×240 文件已从插件和素材目录删除；当前源目录只保留 v3.2 版，style id 不变。

## 本轮双鱼生成提示词

Create a professional illustration asset sheet on genuine transparent background. The supplied reference is only for the sumptuous painterly red-and-gold carp appearance: realistic curved carp anatomy, tiny golden scales, scarlet-red bodies, translucent flowing red-gold fins, luminous golden edges, no white patches. NOT cartoon vector fish.
EXACTLY TWO separate fish, no other subjects. Square canvas.
TOP HALF: one LARGE complete carp leaping UPWARD and to the RIGHT, head highest, elegantly curved S-shaped body, long trailing flowing tail below and left, complete body/all fins/all whiskers, no clipping. It must fit wholly within x=15%-85%, y=4%-45%.
BOTTOM HALF: one SMALL complete carp about 65% of the top fish size, also leaping UPWARD to the right, more curved lively tail, fit wholly inside x=25%-75%, y=57%-95%.
Keep a clear transparent horizontal gap between these two isolated fish; they must NOT overlap. Both face upward, not swimming flat horizontally. Each fish is an independently readable jewel-like beautiful red-gold carp silhouette. Detailed but clean enough to downscale for a chat bubble. No water, no splashes, no background colors, no red backdrop, no shadow, no halo, no text, no labels, no framing. True alpha transparency surrounding BOTH fish, including the gap.
