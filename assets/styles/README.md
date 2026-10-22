# 固定气泡样式素材（assets/styles）

> M2 正式固定气泡样式素材放在这里；每套样式一个目录。
> 规范：请先读 [`docs/BUBBLE_SPEC.md`](../../docs/BUBBLE_SPEC.md) **v3.2**。
> 格式示例：[`assets/templates/style-package-example/`](../templates/style-package-example/)（逻辑 525×42，源图 1050×84 @2x）。

## 目录约定

```text
assets/styles/
└── bubble-<style-id>/
    ├── manifest.json
    ├── background.svg
    ├── accessories/          # 可选
    ├── preview.png
    └── README.md
```

- 每套样式独立参数：`slice / borderWidth / borderImageWidth / padding / textColor / tailColor`；
- 逻辑气泡按 DSH 原版 **525×42**（源图 @2x 1050×84）；实际宽度由内容决定、最大约 525；有真实边框的样式才允许更高；
- 文字区默认 42px（`padding 10/16`），不因底部/顶部装饰加高；图案可进入文字区，靠文字色/描边保证可读；
- 装饰按部件决定是否拉伸：脸/头/logo/尾尖固定，身体/轮廓/条纹/海水可拉伸；不是所有装饰都要拆挂件；
- `preview.png` 是整体效果图，仅用于文档/验收，不参与运行时；
- 素材必须原创或确认授权；非商业/第三方素材不得随 MIT 包发布。

## 当前状态

- ✅ `bubble-clover-meadow/`：固定样式「幸运草坡」，已按 v3.2 重做并替换运行时素材（1050×84 / 42px）；默认仍是 DSH 默认；
- ✅ `bubble-koi-rising/`：固定样式「锦鲤跃潮」，已按 v3.2 重做并替换运行时素材（1050×84 / 42px）；背景压缩为 WebP 内联；
- 后续固定样式继续放在本目录（如 `bubble-galaxy/`、`bubble-cream/`、`bubble-pixel/`）。


