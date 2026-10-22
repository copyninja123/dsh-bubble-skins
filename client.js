/**
 * 气泡样式库 —— 客户端 bundle。
 *
 * 加载器闭包工厂格式：`window.__ModuleLoader__.load({ id, factory })`，
 * id 必须等于 npm 包名。factory 返回 cordis 客户端插件的 `{ inject, apply }`。
 *
 * 运行时职责：
 *   1. 生成「用户气泡作用域内」的 CSS——**每一条规则**都带皮肤作用域前缀；
 *   2. 注入 / 热替换单个 `<style>`（带 data-plugin 归属，便于宿主清理与防残留）；
 *   3. 在 `<html>` 上标记当前样式与尾巴开关，并在卸载时完整还原；
 *   4. 在「设置 → 通用」注册「气泡样式」「气泡尾巴」「气泡背景」「气泡装饰」四行；
 *   5. M2 分层模型：「自定义图片」= 可拉伸背景层 + 固定尺寸装饰层（锚点定位）
 *      + 独立尾巴；文字/内边距由宿主布局决定，装饰不随气泡拉伸。
 *
 * 目标气泡限定为三类（见 BUBBLE_TARGET）：
 *   普通用户行、pending steering、本地提交回声。
 * 注意：`[class*="_bubble"]` 中的 `_bubble` 只是宿主 CSS Modules 类名的后缀，
 * 前缀（构建哈希）会随版本变化；该后缀并非全客户端唯一，因此必须加作用域限定。
 */

window.__ModuleLoader__.load({
  id: 'dsh-bubble-skins',
  factory(require) {
    /** 共享 React 运行时（来自页面模块表，不自装）。 */
    const React = require('react');

    /** 根元素上的皮肤标记属性。 */
    const ROOT_ATTR = 'data-dsh-bubble-skin';

    /** 根元素上的尾巴开关属性（值为 "on" 时显示尾巴）。 */
    const TAIL_ATTR = 'data-dsh-bubble-tail';

    /** 注入的 style 标签 id（用于复用与热更新）。 */
    const STYLE_ID = 'dsh-bubble-skins:style';

    /** style 标签的归属标记：宿主 HMR / 卸载兜底只识别 data-plugin。 */
    const STYLE_OWNER = 'dsh-bubble-skins';

    /** 皮肤选择的本地持久化键名（v3：旧默认键不再读取，确保 DSH 默认生效）。 */
    const STORAGE_KEY = 'dsh-bubble-skins:active-v3';

    /** 尾巴开关的本地持久化键名。 */
    const TAIL_STORAGE_KEY = 'dsh-bubble-skins:tail';

    /** 默认皮肤 id：DSH 原始气泡（不注入气泡样式）。 */
    const DEFAULT_SKIN = 'dsh-default';

    /** 尾巴默认关闭；当前版本隐藏尾巴功能。 */
    const DEFAULT_TAIL = false;

    /** 是否开放用户自定义气泡（M3 再打开；当前版本隐藏）。 */
    const CUSTOM_BUBBLES_ENABLED = false;

    /** 是否显示尾巴设置与尾巴渲染（当前版本暂时不做）。 */
    const TAIL_FEATURE_ENABLED = false;

    /** 控制台调试 API 的版本号（供外部脚本判断兼容性）。 */
    const API_VERSION = '0.10.0';

    /** 设置行使用的 locale 命名空间。 */
    const LOCALE_NS = 'bubbleSkins';

    /** 「气泡样式」行在「通用」分区中的位置：紧跟字号（11）之后。 */
    const SETTINGS_SKIN_ORDER = 11.5;

    /** 「气泡尾巴」行紧跟「气泡样式」行。 */
    const SETTINGS_TAIL_ORDER = 11.6;

    /** 「气泡背景」行紧跟「气泡尾巴」行（M2 分层模型）。 */
    const SETTINGS_IMAGE_ORDER = 11.7;

    /** 「气泡装饰」行紧跟「气泡背景」行。 */
    const SETTINGS_DECOR_ORDER = 11.8;

    /** 分层自定义样式 id（背景 + 装饰 + 尾巴）。 */
    const CUSTOM_STYLE_ID = 'custom-image';

    /** 背景图 data URI 的持久化键名。 */
    const IMAGE_STORAGE_KEY = 'dsh-bubble-skins:image';

    /** 背景图自动文字色的持久化键名。 */
    const IMAGE_FG_STORAGE_KEY = 'dsh-bubble-skins:image-fg';

    /** 背景图尾巴颜色的持久化键名。 */
    const IMAGE_TAIL_STORAGE_KEY = 'dsh-bubble-skins:image-tail';

    /** 背景是否像「整张完整气泡图」的持久化键名。 */
    const IMAGE_BUBBLE_LIKE_KEY = 'dsh-bubble-skins:image-bubble-like';

    /**
     * 装饰槽位（锚点）。
     * 渲染为气泡 `::before` 上的固定尺寸背景层，位置不随气泡尺寸缩放。
     */
    const DECOR_SLOTS = [
      { id: 'tl', key: 'decorTl' },
      { id: 'tr', key: 'decorTr' },
      { id: 'bl', key: 'decorBl' },
      { id: 'br', key: 'decorBr' },
      { id: 'bc', key: 'decorBc' },
    ];

    /** 单个装饰的持久化键名前缀。 */
    const DECOR_STORAGE_PREFIX = 'dsh-bubble-skins:decor:';

    /** 装饰素材按 @2x 设计：显示尺寸 = 图片像素 / 2。 */
    const DECOR_SCALE = 2;

    /** v1 九宫格遗留键：检测到说明旧版完整图已不适用于 v2，需要迁移提示。 */
    const LEGACY_MIGRATION_KEYS = [
      'dsh-bubble-skins:image-slice',
      'dsh-bubble-skins:image-size',
      'dsh-bubble-skins:image-shape',
    ];

    /** 取不到尾巴颜色时的默认值。 */
    const DEFAULT_TAIL_COLOR = '#0d0f13';

    /** 压缩后的图片 data URI 最大字符数（localStorage 安全上限，约 1.5MB）。 */
    const MAX_IMAGE_CHARS = 1_500_000;

    /** 压缩时图片最长边（px）。 */
    const IMAGE_MAX_EDGE = 640;

    /** 内置示例图（自绘 SVG，不引入第三方版权素材）。 */
    const DEMO_IMAGE =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200" viewBox="0 0 640 200" preserveAspectRatio="none">' +
          '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#2b2f36"/><stop offset="1" stop-color="#0d0f13"/>' +
          '</linearGradient></defs>' +
          '<rect width="640" height="200" fill="url(#g)"/>' +
          '<circle cx="560" cy="40" r="2" fill="#ffffff" opacity=".7"/>' +
          '<circle cx="520" cy="90" r="1.5" fill="#ffffff" opacity=".5"/>' +
          '<circle cx="600" cy="120" r="1.2" fill="#ffffff" opacity=".4"/>' +
          '<path d="M40 170 Q120 120 200 150 T360 140 T520 160" stroke="#8fc7ff" stroke-opacity=".35" stroke-width="2" fill="none"/>' +
          '</svg>',
      );

    /** 内置示例图的尾巴颜色（与示例图右下角一致）。 */
    const DEMO_TAIL_COLOR = '#0d0f13';

    /**
     * 气泡目标容器并集（不含作用域根）。
     *
     * - 普通用户行：`[data-chat-flow-kind="user"]`；
     * - pending steering 与本地提交回声没有 flow-kind 行容器，
     *   因此用它们各自的属性单独命中；
     * - 末尾 `[class$="_bubble"]` 精确命中宿主气泡本体（CSS Modules 后缀）。
     *   注意不能用 `[class*="_bubble"]`：宿主 Tooltip 的类名是 `_bubble_12mhf_1`，
     *   子串匹配会把悬停提示气泡也当成用户气泡，导致提示框反复重排。
     */
    const BUBBLE_TARGET =
      ':is([data-chat-flow-kind="user"], [data-pending-steering], [data-submission-echo]) [class$="_bubble"]';

    /**
     * 构造一条气泡规则。
     *
     * @param {string} decl CSS 声明块内容（不含外层花括号）。
     * @param {string} [suffix] 追加在气泡选择器后的后缀，例如 `::after`。
     * @param {boolean} [dark] 是否为暗色规则（自动加 body[data-ds-dark-theme] 前缀）。
     * @returns {{ sel: string, decl: string }} 皮肤规则对象。
     */
    function bubbleRule(decl, suffix = '', dark = false) {
      const prefix = dark ? 'body[data-ds-dark-theme] ' : '';
      return { sel: `${prefix}${BUBBLE_TARGET}${suffix}`, decl: decl.trim() };
    }

    /**
     * 内置皮肤注册表。
     *
     * 每套皮肤只声明与默认外观的差异，由 `rules` 逐条表达；
     * 生成时会自动给每条规则加上 `html[data-dsh-bubble-skin="<id>"]` 前缀，
     * 因此暗色 / 伪元素规则不会泄漏到其他组件。
     *
     * `tailColor` / `tailColorDark` 是尾巴的颜色（伪元素不能继承背景，
     * 所以通过自定义属性 --dsb-tail-bg 从气泡元素传给 ::after）。
     * `swatch` 仅用于设置行的色块预览，不参与页面样式。
     *
     * @typedef {{ id: string, name: { zh: string, en: string }, description: { zh: string, en: string }, swatch: string, tailColor: string, tailColorDark?: string, noTail?: boolean, rules: Array<{ sel: string, decl: string }> }} BubbleSkin
     */
    const SKINS = [
      {
        id: 'dsh-default',
        name: { zh: 'DSH 默认', en: 'DSH Default' },
        description: {
          zh: 'DSH 原始气泡外观；不注入气泡样式，适合想恢复默认时直接切换。',
          en: 'Original DSH bubble appearance with no injected bubble styles.',
        },
        swatch: 'linear-gradient(135deg, #f7f8fa 0%, #e3e7ed 100%)',
        tailColor: 'transparent',
        noTail: true,
        rules: [],
      },
      {
        id: 'bubble-clover-meadow',
        name: { zh: '幸运草坡', en: 'Clover Meadow' },
        description: {
          zh: '42px 矮气泡，顶部叶草、四角三叶草与四叶草、底部连续浅绿薄草坡。',
          en: 'A compact 42px bubble with upper leaves, fixed corner clovers and continuous pale meadow slopes.',
        },
        swatch: 'linear-gradient(135deg, #F3F9E5 0%, #CBE19F 100%)',
        tailColor: '#F2F8EA',
        noTail: true,
        rules: [
          bubbleRule(`
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  padding: 10px 16px 10px 16px;
  border: none;
  background: transparent;
  color: #244B30;
  text-shadow: none;
`),
          bubbleRule(
            `
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-style: solid;
  border-width: 14px 22px 14px 22px;
  border-color: transparent;
  border-image-source: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDUwIiBoZWlnaHQ9Ijg0IiB2aWV3Qm94PSIwIDAgMTA1MCA4NCIgZmlsbD0ibm9uZSI+CiAgPHRpdGxlPuW5uOi/kOiNieWdoTwvdGl0bGU+CiAgPGRlc2M+5YWo5paw5qiq5ZCR55+u5bmF6I2J5Z2h77yb5LiJ5Y+26I2J44CB5Zub5Y+26I2J5ZKM6aG26YOo5Y+254mH5YWo6YOo5L2N5LqO5Zu65a6a6KeS5YaF77yM5Lit6Ze05Y+q5pyJ5Y+v6L+e57ut5ouJ5Ly455qE5rWF6Imy6I2J5Z2h44CC5q2j5paH55Sx6L+Q6KGM5pe257uY5Yi244CCPC9kZXNjPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJtZWFkb3ctbGlnaHQiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSI4NCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjRjVGQUVFIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMC42NSIgc3RvcC1jb2xvcj0iI0YyRjhFQSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNFQUYzREUiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8Y2xpcFBhdGggaWQ9InNoZWxsIj4KICAgICAgPHJlY3Qgd2lkdGg9IjEwNTAiIGhlaWdodD0iODQiIHJ4PSIyMCIvPgogICAgPC9jbGlwUGF0aD4KICAgIDwhLS0g5b+D5b2i5bCP5Y+25Lul5Y6f54K55Li65Y+25p+E56uv77yb5a6e5L6L5Y+q5peL6L2s77yM5LiN57yp5pS+5pen5qy+57Sg5p2Q44CCIC0tPgogICAgPHBhdGggaWQ9ImhlYXJ0LWxlYWYiIGQ9Ik0wIDBDLTMtMi05LTUtOC05Qy03LTEyLTItMTIgMC05QzItMTIgNy0xMiA4LTlDOS01IDMtMiAwIDBaIi8+CiAgPC9kZWZzPgogIDxnIGNsaXAtcGF0aD0idXJsKCNzaGVsbCkiPgogICAgPHJlY3Qgd2lkdGg9IjEwNTAiIGhlaWdodD0iODQiIGZpbGw9InVybCgjbWVhZG93LWxpZ2h0KSIvPgogICAgPCEtLSDkuK3pg6jml6DmuIXmmbDlj7bojYnvvJvkuInlsYLoloTlnaHlnYflrozmlbTotK/nqb/mqKrlkJHliIfniYfnur/jgIIgLS0+CiAgICA8cGF0aCBkPSJNMCA2OUMxMjAgNjMgMjM4IDczIDM1NCA2OVM1ODggNjQgNzA2IDY5UzkzOCA2NCAxMDUwIDY4Vjg0SDBaIiBmaWxsPSIjRTBFREM5Ii8+CiAgICA8cGF0aCBkPSJNMCA3NkMxMzAgNzEgMjQwIDgwIDM2NiA3NVM2MDQgNzMgNzM0IDc2Uzk0MCA3MiAxMDUwIDc1Vjg0SDBaIiBmaWxsPSIjRDJFNUI2Ii8+CiAgICA8cGF0aCBkPSJNMCA4MUMxNDggNzcgMjU0IDg0IDM5MCA4MFM2MjAgNzkgNzYwIDgxUzk2NCA3OCAxMDUwIDgwVjg0SDBaIiBmaWxsPSIjQzZERkE3Ii8+CgogICAgPCEtLSDlt6bkuIrlm7rlrprop5LvvJrlhajpg6jlh6DkvZXkvY3kuo4geDw0NOOAgXk8MjjjgIIgLS0+CiAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyNyAxNSkiPgogICAgICA8cGF0aCBkPSJNMCAwUTUgNCA3IDEwIiBzdHJva2U9IiNCOEQ0OTgiIHN0cm9rZS13aWR0aD0iMS40IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgICAgPHVzZSBocmVmPSIjaGVhcnQtbGVhZiIgZmlsbD0iI0MyRERBNiIvPgogICAgICA8dXNlIGhyZWY9IiNoZWFydC1sZWFmIiB0cmFuc2Zvcm09InJvdGF0ZSgxMjApIiBmaWxsPSIjQ0VFM0I1Ii8+CiAgICAgIDx1c2UgaHJlZj0iI2hlYXJ0LWxlYWYiIHRyYW5zZm9ybT0icm90YXRlKDI0MCkiIGZpbGw9IiNCOEQ0OTgiLz4KICAgICAgPHBhdGggZD0iTTAtMlYtN00yIDFMNiA0TS0yIDFMLTYgNCIgc3Ryb2tlPSIjRTVGMEQyIiBzdHJva2Utd2lkdGg9IjAuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgICA8L2c+CgogICAgPCEtLSDlj7PkuIrlm7rlrprop5LvvJrlsI/lj7bmnp3lhajpg6jkvY3kuo4geD4xMDA244CBeTwyOOOAgiAtLT4KICAgIDxwYXRoIGQ9Ik0xMDEwIDI0UTEwMjEgMTggMTAzMyA3IiBzdHJva2U9IiNCOEQ0OTgiIHN0cm9rZS13aWR0aD0iMS4zIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgIDxwYXRoIGQ9Ik0xMDE3IDIwQzEwMDkgMjAgMTAwNiAxNSAxMDA4IDEwQzEwMTQgMTAgMTAxOCAxNCAxMDE3IDIwWiIgZmlsbD0iI0NFRTNCNSIvPgogICAgPHBhdGggZD0iTTEwMjQgMTVDMTAyMiA4IDEwMjYgNCAxMDMyIDRDMTAzNCA5IDEwMzAgMTQgMTAyNCAxNVoiIGZpbGw9IiNDMkREQTYiLz4KICAgIDxwYXRoIGQ9Ik0xMDI0IDE2QzEwMzAgMTIgMTAzNSAxNCAxMDM4IDE4QzEwMzQgMjMgMTAyOCAyMiAxMDI0IDE2WiIgZmlsbD0iI0Q3RTlDMSIvPgoKICAgIDwhLS0g5bem5LiL5Zu65a6a6KeS77ya5LiJ5Y+26I2J5LiO6I2J5bCW5YWo6YOo5L2N5LqOIHg8NDTjgIF5PjU244CCIC0tPgogICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjcgNjkpIj4KICAgICAgPHBhdGggZD0iTTAgMFE1IDUgNCAxMiIgc3Ryb2tlPSIjQjhENDk4IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgICAgIDx1c2UgaHJlZj0iI2hlYXJ0LWxlYWYiIGZpbGw9IiNCOEQ0OTgiLz4KICAgICAgPHVzZSBocmVmPSIjaGVhcnQtbGVhZiIgdHJhbnNmb3JtPSJyb3RhdGUoMTIwKSIgZmlsbD0iI0MyRERBNiIvPgogICAgICA8dXNlIGhyZWY9IiNoZWFydC1sZWFmIiB0cmFuc2Zvcm09InJvdGF0ZSgyNDApIiBmaWxsPSIjQ0VFM0I1Ii8+CiAgICAgIDxwYXRoIGQ9Ik0wLTJWLTdNMiAxTDYgNE0tMiAxTC02IDQiIHN0cm9rZT0iI0U1RjBEMiIgc3Ryb2tlLXdpZHRoPSIwLjgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogICAgPC9nPgogICAgPHBhdGggZD0iTTkgODNMOCA3NkwxMiA4MUwxNSA3NEwxNSA4NFpNNDIgODRMNDAgNzdMNDUgODFMNDggNzZMNDcgODRaIiBmaWxsPSIjQjhENDk4Ii8+CgogICAgPCEtLSDlj7PkuIvlm7rlrprop5LvvJrlm5vniYflv4PlvaLlj7blhajpg6jkvY3kuo4geD4xMDA244CBeT41NuOAgiAtLT4KICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEwMjMgNjgpIj4KICAgICAgPHBhdGggZD0iTTAgMFEtNSA3LTQgMTQiIHN0cm9rZT0iI0I4RDQ5OCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogICAgICA8dXNlIGhyZWY9IiNoZWFydC1sZWFmIiBmaWxsPSIjQjhENDk4Ii8+CiAgICAgIDx1c2UgaHJlZj0iI2hlYXJ0LWxlYWYiIHRyYW5zZm9ybT0icm90YXRlKDkwKSIgZmlsbD0iI0NFRTNCNSIvPgogICAgICA8dXNlIGhyZWY9IiNoZWFydC1sZWFmIiB0cmFuc2Zvcm09InJvdGF0ZSgxODApIiBmaWxsPSIjQzJEREE2Ii8+CiAgICAgIDx1c2UgaHJlZj0iI2hlYXJ0LWxlYWYiIHRyYW5zZm9ybT0icm90YXRlKDI3MCkiIGZpbGw9IiNEN0U5QzEiLz4KICAgICAgPHBhdGggZD0iTTAtMlYtN00yIDBIN00wIDJWN00tMiAwSC03IiBzdHJva2U9IiNFNUYwRDIiIHN0cm9rZS13aWR0aD0iMC44IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgIDwvZz4KICAgIDxwYXRoIGQ9Ik0xMDAyIDg0TDEwMDEgNzdMMTAwNSA4MUwxMDA4IDc1TDEwMDggODRaTTEwMzcgODRMMTAzNSA3NkwxMDQwIDgxTDEwNDIgNzdMMTA0MiA4NFoiIGZpbGw9IiNCOEQ0OTgiLz4KICA8L2c+Cjwvc3ZnPgo=");
  border-image-slice: 28 44 28 44 fill;
  border-image-width: 14px 22px 14px 22px;
  border-image-repeat: stretch;
  border-radius: 0;
`,
            '::before',
          ),
        ],
      },
      {
        id: 'bubble-koi-rising',
        name: { zh: '锦鲤跃潮', en: 'Rising Golden Koi' },
        description: {
          zh: '42px 矮气泡，顶部金色流光与连续蓝海水，右侧一大一小红金锦鲤跃起。',
          en: 'A compact 42px bubble with upper gold currents, continuous blue surf and two rising red-gold koi.',
        },
        swatch: 'linear-gradient(135deg, #F74421 0%, #FFB43B 55%, #F8E7A0 100%)',
        tailColor: '#FFAE61',
        noTail: true,
        rules: [
          bubbleRule(`
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  padding: 10px 42px 10px 16px;
  border: none;
  background: transparent;
  color: #240A05;
  text-shadow: none;
`),
          bubbleRule(
            `
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-style: solid;
  border-width: 20px 40px 18px 14px;
  border-color: transparent;
  border-image-source: url("data:image/webp;base64,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");
  border-image-slice: 40 80 36 28 fill;
  border-image-width: 20px 40px 18px 14px;
  border-image-repeat: stretch;
  border-radius: 0;
`,
            '::before',
          ),
        ],
      },
      {
        id: 'qq-blue',
        name: { zh: 'QQ 经典蓝', en: 'QQ Classic Blue' },
        description: {
          zh: '浅蓝底 + 右侧气泡尾巴，最接近 QQ 默认观感。',
          en: 'Light blue bubble with a right-side tail.',
        },
        swatch: 'linear-gradient(135deg, #edf3fe 0%, #d3e2ff 100%)',
        tailColor: 'var(--dsw-specific-bubble)',
        rules: [
          bubbleRule(`
  position: relative;
  border-radius: 16px 6px 16px 16px;
  background: var(--dsw-specific-bubble);
  box-shadow: 0 1px 2px rgba(18, 122, 175, 0.12);
`),
          bubbleRule(
            `
  box-shadow: none;
`,
            '',
            true,
          ),
        ],
      },
      {
        id: 'qq-deco',
        name: { zh: 'QQ 装饰气泡', en: 'QQ Decorative' },
        description: {
          zh: '深色渐变底 + 两侧装饰角，对应参考图里的会员气泡观感。',
          en: 'Dark gradient bubble with decorative corner ornaments.',
        },
        swatch: 'linear-gradient(180deg, #2b2f36 0%, #15181d 100%)',
        tailColor: '#15181d',
        tailColorDark: '#101318',
        rules: [
          bubbleRule(`
  position: relative;
  border-radius: 18px;
  padding: 12px 20px;
  background: linear-gradient(180deg, #2b2f36 0%, #15181d 100%);
  color: #f2f3f5;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
`),
          // 两侧装饰角统一挂在 ::before 上（::after 留给可开关的小尾巴）。
          bubbleRule(
            `
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.85;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0 2px, transparent 3px) left -14px bottom -12px / 30px 30px no-repeat,
    linear-gradient(135deg, transparent 42%, rgba(255, 255, 255, 0.55) 46% 50%, transparent 54%) left -14px bottom -12px / 30px 30px no-repeat,
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0 2px, transparent 3px) right -14px top -12px / 30px 30px no-repeat,
    linear-gradient(135deg, transparent 42%, rgba(255, 255, 255, 0.55) 46% 50%, transparent 54%) right -14px top -12px / 30px 30px no-repeat;
`,
            '::before',
          ),
          bubbleRule(
            `
  background: linear-gradient(180deg, #23272e 0%, #101318 100%);
`,
            '',
            true,
          ),
        ],
      },
      {
        id: 'glass',
        name: { zh: '毛玻璃', en: 'Frosted Glass' },
        description: {
          zh: '半透明磨砂底 + 细边框，适合浅色与图片背景主题。',
          en: 'Translucent frosted bubble with a hairline border.',
        },
        swatch: 'rgba(255, 255, 255, 0.55)',
        tailColor: 'rgba(255, 255, 255, 0.42)',
        tailColorDark: 'rgba(28, 34, 44, 0.55)',
        rules: [
          bubbleRule(`
  position: relative;
  border-radius: 18px;
  padding: 11px 18px;
  background: rgba(255, 255, 255, 0.42);
  color: #1d2733;
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 6px 20px rgba(20, 40, 60, 0.12);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
`),
          bubbleRule(
            `
  background: rgba(28, 34, 44, 0.55);
  color: #e9eef5;
  border-color: rgba(255, 255, 255, 0.16);
`,
            '',
            true,
          ),
        ],
      },
      {
        id: 'pixel',
        name: { zh: '像素风', en: 'Pixel' },
        description: {
          zh: '直角 + 4px 硬阴影 + 像素边框，复古终端感。',
          en: 'Square corners, hard shadow and a pixel border.',
        },
        swatch: '#fdf6e3',
        tailColor: '#fdf6e3',
        tailColorDark: '#1a1a1a',
        rules: [
          bubbleRule(`
  position: relative;
  border-radius: 2px;
  padding: 10px 16px;
  background: #fdf6e3;
  color: #1b1b1b;
  border: 3px solid #1b1b1b;
  box-shadow: 4px 4px 0 #1b1b1b;
`),
          bubbleRule(
            `
  background: #1a1a1a;
  color: #e8e8d0;
  border-color: #e8e8d0;
  box-shadow: 4px 4px 0 #e8e8d0;
`,
            '',
            true,
          ),
        ],
      },
      {
        id: 'minimal',
        name: { zh: '极简', en: 'Minimal' },
        description: {
          zh: '去掉底色与阴影，只保留文字和细分隔线。',
          en: 'No background or shadow; text with a hairline only.',
        },
        swatch: 'transparent',
        tailColor: 'var(--dsw-alias-border-l2)',
        rules: [
          bubbleRule(`
  position: relative;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  border-left: 2px solid var(--dsw-alias-border-l2);
  border-radius: 0;
  padding: 2px 12px;
  box-shadow: none;
`),
        ],
      },
    ];

    /** 皮肤 id → 定义 的索引。 */
    const SKIN_MAP = new Map(SKINS.map((skin) => [skin.id, skin]));

    /** 设置行用的中英文案（运行时 locale 字典）。 */
    const LOCALE_DICTS = {
      zh: {
        label: '气泡样式',
        description: '选择你发送的消息气泡外观，切换后立即生效。',
        tailLabel: '气泡尾巴',
        tailDescription: '在用户气泡右侧显示一个小尾巴，对所有皮肤生效。',
        imageLabel: '气泡背景',
        imageDescription: '「自定义图片」样式的背景层，会拉伸铺满气泡；四角/底部花纹请用下方「气泡装饰」。',
        imageInactiveHint: '背景已保存，但当前不是「自定义图片」样式，可在「气泡样式」中选择它。',
        imagePick: '选择背景',
        imageChange: '更换背景',
        imageClear: '清除背景',
        imageDemo: '示例背景',
        imageBusy: '处理中…',
        imageError: '图片处理失败，请换一张试试',
        imageTooLarge: '图片过大，请换一张小一点的',
        imageLegacyHint: '旧版九宫格素材已停用，请重新上传「背景 + 装饰」分层素材。',
        imageBubbleLikeHint: '检测到背景四角透明，像是整张气泡图：已改用「保持比例裁剪」，建议拆成「背景层 + 装饰层」后再上传。',
        decorLabel: '气泡装饰',
        decorDescription: '固定尺寸的透明装饰（建议 @2x 素材），按锚点贴边，不随文字拉伸。',
        decorHint: '点锚点按钮上传/更换，× 清除；显示尺寸 = 图片像素 ÷ 2。',
        decorTl: '左上',
        decorTr: '右上',
        decorBl: '左下',
        decorBr: '右下',
        decorBc: '底部',
        decorRemove: '清除装饰',
        customStyle: '自定义图片',
        'dsh-default': 'DSH 默认',
        'bubble-clover-meadow': '幸运草坡',
        'bubble-koi-rising': '锦鲤跃潮',
        'qq-blue': 'QQ 经典蓝',
        'qq-deco': 'QQ 装饰气泡',
        glass: '毛玻璃',
        pixel: '像素风',
        minimal: '极简',
      },
      en: {
        label: 'Bubble style',
        description: 'Choose how your message bubbles look. Changes apply instantly.',
        tailLabel: 'Bubble tail',
        tailDescription: 'Show a small tail on the right side of your message bubbles for every style.',
        imageLabel: 'Bubble background',
        imageDescription: 'Background layer of the "Custom image" style; it stretches to fill the bubble. Use "Decorations" for corner art.',
        imageInactiveHint: 'Background saved, but the "Custom image" style is not selected.',
        imagePick: 'Choose background',
        imageChange: 'Replace background',
        imageClear: 'Clear background',
        imageDemo: 'Sample background',
        imageBusy: 'Processing…',
        imageError: 'Failed to process the image, please try another one',
        imageTooLarge: 'Image is too large, please choose a smaller one',
        imageLegacyHint: 'The old nine-patch image was retired. Please re-upload layered background + decorations.',
        imageBubbleLikeHint: 'The background has transparent corners (looks like a full bubble image). It is now cropped to keep its ratio; please split it into background + decorations.',
        decorLabel: 'Bubble decorations',
        decorDescription: 'Fixed-size transparent decorations (use @2x assets) anchored to the bubble; they never stretch.',
        decorHint: 'Click an anchor to upload/replace, × to clear; display size = image pixels ÷ 2.',
        decorTl: 'Top-left',
        decorTr: 'Top-right',
        decorBl: 'Bottom-left',
        decorBr: 'Bottom-right',
        decorBc: 'Bottom',
        decorRemove: 'Remove decoration',
        customStyle: 'Custom image',
        'dsh-default': 'DSH Default',
        'bubble-clover-meadow': 'Clover Meadow',
        'bubble-koi-rising': 'Rising Golden Koi',
        'qq-blue': 'QQ Classic Blue',
        'qq-deco': 'QQ Decorative',
        glass: 'Frosted Glass',
        pixel: 'Pixel',
        minimal: 'Minimal',
      },
    };

    /** 当前皮肤 / 尾巴变化订阅者集合。 */
    const listeners = new Set();

    /**
     * 通知所有订阅者（单个订阅者抛错不影响其他订阅者）。
     *
     * @returns {void}
     */
    function notify() {
      for (const listener of [...listeners]) {
        try {
          listener();
        } catch (error) {
          console.error('[dsh-bubble-skins] listener failed', error);
        }
      }
    }

    /**
     * 订阅皮肤 / 尾巴变化。
     *
     * @param {() => void} listener 变化回调。
     * @returns {() => void} 取消订阅函数；传入非法参数时返回空函数。
     */
    function subscribe(listener) {
      if (typeof listener !== 'function') return () => undefined;
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }

    /**
     * 读取本地持久化的皮肤 id。
     *
     * @returns {string} 可用的皮肤 id，非法值回落到默认皮肤。
     */
    function readActiveId() {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (CUSTOM_BUBBLES_ENABLED && stored === CUSTOM_STYLE_ID && hasAnyLayer()) return CUSTOM_STYLE_ID;
        if (stored && SKIN_MAP.has(stored)) return stored;
      } catch {
        // localStorage 不可用（隐私模式等）时静默回落到默认皮肤。
      }
      return DEFAULT_SKIN;
    }

    /**
     * 写入本地持久化的皮肤 id。
     *
     * @param {string} skinId 皮肤 id。
     * @returns {void}
     */
    function writeActiveId(skinId) {
      try {
        window.localStorage.setItem(STORAGE_KEY, skinId);
      } catch {
        // 持久化失败不影响本次切换。
      }
    }

    /**
     * 读取本地持久化的尾巴开关。
     *
     * @returns {boolean} 是否显示尾巴。
     */
    function readTailEnabled() {
      try {
        const stored = window.localStorage.getItem(TAIL_STORAGE_KEY);
        if (stored === 'on') return true;
        if (stored === 'off') return false;
      } catch {
        // localStorage 不可用时使用默认值。
      }
      return DEFAULT_TAIL;
    }

    /**
     * 写入本地持久化的尾巴开关。
     *
     * @param {boolean} enabled 是否显示尾巴。
     * @returns {void}
     */
    function writeTailEnabled(enabled) {
      try {
        window.localStorage.setItem(TAIL_STORAGE_KEY, enabled ? 'on' : 'off');
      } catch {
        // 持久化失败不影响本次切换。
      }
    }

    /** 当前尾巴开关状态（挂载时从持久化恢复）。 */
    let tailEnabled = DEFAULT_TAIL;

    /**
     * 把尾巴开关同步到根元素属性（CSS 通过该属性控制尾巴规则是否生效）。
     *
     * @param {boolean} enabled 是否显示尾巴。
     * @returns {void}
     */
    function applyTailAttribute(enabled) {
      if (enabled) document.documentElement.setAttribute(TAIL_ATTR, 'on');
      else document.documentElement.removeAttribute(TAIL_ATTR);
    }

    /** 当前分层样式的背景图 data URI（null 表示未设置）。 */
    let imageDataUrl = null;

    /** 背景图层自动文字色。 */
    let imageForeground = '#ffffff';

    /** 背景图层取样的尾巴颜色。 */
    let imageTailColor = DEFAULT_TAIL_COLOR;

    /** 背景是否像整张完整气泡图（四角透明）；是则背景改用 cover 防止拉伸变形。 */
    let backgroundLooksLikeBubble = false;

    /** 装饰槽位状态：anchor → { dataUrl, width, height } | null。 */
    const decorations = { tl: null, tr: null, bl: null, br: null, bc: null };

    /** 是否检测到并停用了 v1 九宫格旧素材（用于设置行提示）。 */
    let legacyImageReset = false;

    /**
     * 是否已有任意一层内容（背景或装饰）。
     *
     * @returns {boolean} 是否有内容。
     */
    function hasAnyLayer() {
      return Boolean(imageDataUrl) || DECOR_SLOTS.some((slot) => Boolean(decorations[slot.id]));
    }

    /**
     * 读取本地持久化的背景层配置；检测到 v1 九宫格遗留键时自动停用旧完整图。
     *
     * @returns {{ dataUrl: string|null, foreground: string, tailColor: string, legacyReset: boolean }} 背景配置。
     */
    function readImageConfig() {
      try {
        const legacyReset = LEGACY_MIGRATION_KEYS.some((key) => window.localStorage.getItem(key) !== null);
        let dataUrl = window.localStorage.getItem(IMAGE_STORAGE_KEY);
        let foreground = window.localStorage.getItem(IMAGE_FG_STORAGE_KEY) || '#ffffff';
        let tailColor = window.localStorage.getItem(IMAGE_TAIL_STORAGE_KEY) || DEFAULT_TAIL_COLOR;
        let looksLikeBubble = window.localStorage.getItem(IMAGE_BUBBLE_LIKE_KEY) === 'on';
        if (legacyReset) {
          // v1 的完整气泡图在 v2 会被当背景拉伸，直接停用并清掉旧键，避免用户误以为坏了。
          dataUrl = null;
          foreground = '#ffffff';
          tailColor = DEFAULT_TAIL_COLOR;
          looksLikeBubble = false;
          window.localStorage.removeItem(IMAGE_STORAGE_KEY);
          window.localStorage.removeItem(IMAGE_FG_STORAGE_KEY);
          window.localStorage.removeItem(IMAGE_TAIL_STORAGE_KEY);
          window.localStorage.removeItem(IMAGE_BUBBLE_LIKE_KEY);
          for (const key of LEGACY_MIGRATION_KEYS) window.localStorage.removeItem(key);
        }
        return { dataUrl: dataUrl || null, foreground, tailColor, looksLikeBubble, legacyReset };
      } catch {
        return {
          dataUrl: null,
          foreground: '#ffffff',
          tailColor: DEFAULT_TAIL_COLOR,
          looksLikeBubble: false,
          legacyReset: false,
        };
      }
    }

    /**
     * 写入背景层配置。
     *
     * @param {string|null} dataUrl 背景 data URI。
     * @param {string} foreground 文字颜色。
     * @param {string} tailColor 尾巴颜色。
     * @param {boolean} looksLikeBubble 背景是否像整张完整气泡图。
     * @returns {void}
     */
    function writeImageConfig(dataUrl, foreground, tailColor, looksLikeBubble = false) {
      try {
        if (dataUrl) {
          window.localStorage.setItem(IMAGE_STORAGE_KEY, dataUrl);
          window.localStorage.setItem(IMAGE_FG_STORAGE_KEY, foreground);
          window.localStorage.setItem(IMAGE_TAIL_STORAGE_KEY, tailColor);
          if (looksLikeBubble) window.localStorage.setItem(IMAGE_BUBBLE_LIKE_KEY, 'on');
          else window.localStorage.removeItem(IMAGE_BUBBLE_LIKE_KEY);
        } else {
          window.localStorage.removeItem(IMAGE_STORAGE_KEY);
          window.localStorage.removeItem(IMAGE_FG_STORAGE_KEY);
          window.localStorage.removeItem(IMAGE_TAIL_STORAGE_KEY);
          window.localStorage.removeItem(IMAGE_BUBBLE_LIKE_KEY);
        }
      } catch (error) {
        console.warn('[dsh-bubble-skins] background persist failed', error);
      }
    }

    /**
     * 读取全部装饰槽位。
     *
     * @returns {void}
     */
    function readDecorations() {
      for (const slot of DECOR_SLOTS) {
        decorations[slot.id] = null;
        try {
          const raw = window.localStorage.getItem(DECOR_STORAGE_PREFIX + slot.id);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (
            parsed &&
            typeof parsed.dataUrl === 'string' &&
            parsed.dataUrl.startsWith('data:image/') &&
            Number.isFinite(parsed.width) &&
            parsed.width > 0 &&
            Number.isFinite(parsed.height) &&
            parsed.height > 0
          ) {
            decorations[slot.id] = {
              dataUrl: parsed.dataUrl,
              width: Math.round(parsed.width),
              height: Math.round(parsed.height),
            };
          }
        } catch {
          // 单个装饰损坏不影响其他槽位。
        }
      }
    }

    /**
     * 写入单个装饰槽位。
     *
     * @param {string} slotId 槽位 id。
     * @param {{ dataUrl: string, width: number, height: number }|null} item 装饰数据。
     * @returns {void}
     */
    function writeDecoration(slotId, item) {
      try {
        if (item) window.localStorage.setItem(DECOR_STORAGE_PREFIX + slotId, JSON.stringify(item));
        else window.localStorage.removeItem(DECOR_STORAGE_PREFIX + slotId);
      } catch (error) {
        console.warn('[dsh-bubble-skins] decoration persist failed', error);
      }
    }

    /**
     * 把分层样式用到的 CSS 变量同步到根元素。
     *
     * @returns {void}
     */
    function applyImageState() {
      const root = document.documentElement;
      if (imageDataUrl) root.style.setProperty('--dsb-bg-image', `url("${imageDataUrl}")`);
      else root.style.removeProperty('--dsb-bg-image');
      root.style.setProperty('--dsb-bg-fit', backgroundLooksLikeBubble ? 'cover' : '100% 100%');
      root.style.setProperty('--dsb-image-fg', imageForeground);
      root.style.setProperty(
        '--dsb-image-shadow',
        imageForeground === '#ffffff' ? '0 1px 2px rgba(0, 0, 0, 0.35)' : 'none',
      );
      root.style.setProperty('--dsb-image-tail', imageTailColor);
      for (const slot of DECOR_SLOTS) {
        const item = decorations[slot.id];
        const imageVar = `--dsb-deco-${slot.id}-image`;
        const sizeVar = `--dsb-deco-${slot.id}-size`;
        if (item) {
          root.style.setProperty(imageVar, `url("${item.dataUrl}")`);
          root.style.setProperty(
            sizeVar,
            `${Math.max(1, Math.round(item.width / DECOR_SCALE))}px ${Math.max(1, Math.round(item.height / DECOR_SCALE))}px`,
          );
        } else {
          root.style.removeProperty(imageVar);
          root.style.removeProperty(sizeVar);
        }
      }
    }

    /**
     * 运行时生成「自定义图片」样式（M2 分层模型）。
     *
     * 结构：
     * - 气泡本体负责文字布局与内边距（官方 10px / 16px），文字变长只影响气泡尺寸；
     * - `::before` 负责背景层 + 最多 5 个固定尺寸装饰层（multi-background）：
     *   普通背景拉伸 100% 100%；若检测到整张气泡图（四角透明）则改用 cover
     *   保持比例裁剪，避免换行时圆角/花边被拉伸；装饰按锚点定位、尺寸固定；
     * - 尾巴由 `::after` 独立绘制，颜色从背景图右下角取样。
     *
     * @returns {BubbleSkin} 自定义样式定义。
     */
    function buildCustomSkin() {
      return {
        id: CUSTOM_STYLE_ID,
        name: { zh: '自定义图片', en: 'Custom image' },
        description: {
          zh: '分层气泡：可拉伸背景 + 固定装饰 + 独立尾巴。',
          en: 'Layered bubble: stretchable background + fixed decorations + independent tail.',
        },
        swatch: imageDataUrl
          ? `url("${imageDataUrl}") center / cover no-repeat`
          : 'linear-gradient(135deg, #12203f 0%, #1f4a93 100%)',
        tailColor: 'var(--dsb-image-tail, #0d0f13)',
        rules: [
          bubbleRule(`
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--dsb-image-fg, #ffffff);
  text-shadow: var(--dsb-image-shadow, none);
`),
          bubbleRule(
            `
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: var(--dsw-radius-xl);
  background-color: transparent;
  background-image:
    var(--dsb-deco-tl-image, none),
    var(--dsb-deco-tr-image, none),
    var(--dsb-deco-bl-image, none),
    var(--dsb-deco-br-image, none),
    var(--dsb-deco-bc-image, none),
    var(--dsb-bg-image, linear-gradient(135deg, #12203f 0%, #1f4a93 100%));
  background-size:
    var(--dsb-deco-tl-size, auto),
    var(--dsb-deco-tr-size, auto),
    var(--dsb-deco-bl-size, auto),
    var(--dsb-deco-br-size, auto),
    var(--dsb-deco-bc-size, auto),
    var(--dsb-bg-fit, 100% 100%);
  background-position: left 8px top 8px, right 8px top 8px, left 8px bottom 8px, right 8px bottom 8px, center bottom 8px, center;
  background-repeat: no-repeat;
`,
            '::before',
          ),
        ],
      };
    }

    /**
     * 设置/更换背景层，并切换到分层样式。
     *
     * @param {string} dataUrl 背景 data URI。
     * @param {string} [foreground] 文字颜色。
     * @param {string} [tailColor] 尾巴颜色。
     * @param {boolean} [looksLikeBubble] 是否像整张完整气泡图（影响背景填充模式）。
     * @returns {boolean} 是否成功。
     * @throws {Error} 图片不合法或体积过大时抛出。
     */
    function setBackground(
      dataUrl,
      foreground = '#ffffff',
      tailColor = DEFAULT_TAIL_COLOR,
      looksLikeBubble = false,
    ) {
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        throw new Error('image-invalid');
      }
      if (dataUrl.length > MAX_IMAGE_CHARS) throw new Error('image-too-large');
      imageDataUrl = dataUrl;
      imageForeground = foreground;
      imageTailColor = tailColor;
      backgroundLooksLikeBubble = Boolean(looksLikeBubble);
      legacyImageReset = false;
      writeImageConfig(imageDataUrl, imageForeground, imageTailColor, backgroundLooksLikeBubble);
      applyImageState();
      writeActiveId(CUSTOM_STYLE_ID);
      mount(CUSTOM_STYLE_ID);
      return true;
    }

    /**
     * 清除背景层；若没有任何层则回退默认皮肤。
     *
     * @returns {void}
     */
    function clearBackground() {
      imageDataUrl = null;
      imageForeground = '#ffffff';
      imageTailColor = DEFAULT_TAIL_COLOR;
      backgroundLooksLikeBubble = false;
      legacyImageReset = false;
      writeImageConfig(null, '#ffffff', DEFAULT_TAIL_COLOR, false);
      applyImageState();
      if (!hasAnyLayer() && document.documentElement.getAttribute(ROOT_ATTR) === CUSTOM_STYLE_ID) {
        setSkin(DEFAULT_SKIN);
      } else {
        notify();
      }
    }

    /**
     * 设置/更换某个槽位的装饰。
     *
     * @param {string} slotId 槽位 id（tl / tr / bl / br / bc）。
     * @param {string} dataUrl 装饰 data URI。
     * @param {number} width 图片像素宽。
     * @param {number} height 图片像素高。
     * @returns {boolean} 是否成功。
     * @throws {Error} 参数不合法或体积过大时抛出。
     */
    function setDecoration(slotId, dataUrl, width, height) {
      if (!Object.prototype.hasOwnProperty.call(decorations, slotId)) return false;
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        throw new Error('image-invalid');
      }
      if (dataUrl.length > MAX_IMAGE_CHARS) throw new Error('image-too-large');
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        throw new Error('image-invalid-size');
      }
      decorations[slotId] = { dataUrl, width: Math.round(width), height: Math.round(height) };
      legacyImageReset = false;
      writeDecoration(slotId, decorations[slotId]);
      applyImageState();
      writeActiveId(CUSTOM_STYLE_ID);
      if (document.documentElement.getAttribute(ROOT_ATTR) === CUSTOM_STYLE_ID) {
        notify();
      } else {
        mount(CUSTOM_STYLE_ID);
      }
      return true;
    }

    /**
     * 清除某个槽位的装饰；若没有任何层则回退默认皮肤。
     *
     * @param {string} slotId 槽位 id。
     * @returns {boolean} 是否成功。
     */
    function clearDecoration(slotId) {
      if (!Object.prototype.hasOwnProperty.call(decorations, slotId)) return false;
      decorations[slotId] = null;
      legacyImageReset = false;
      writeDecoration(slotId, null);
      applyImageState();
      if (!hasAnyLayer() && document.documentElement.getAttribute(ROOT_ATTR) === CUSTOM_STYLE_ID) {
        setSkin(DEFAULT_SKIN);
      } else {
        notify();
      }
      return true;
    }

    /**
     * 生成某一套皮肤的完整样式表。
     *
     * 作用域统一为 `html[data-dsh-bubble-skin="<id>"]`；
     * **每一条规则**都单独加前缀，避免 `::after` / 暗色规则泄漏成全局规则。
     * 尾巴规则额外以 `[data-dsh-bubble-tail="on"]` 门控，因此开关尾巴无需重建样式表。
     *
     * @param {BubbleSkin} skin 皮肤定义。
     * @returns {string} 可直接写入 style 标签的 CSS 文本。
     */
    function buildCss(skin) {
      const scope = `html[${ROOT_ATTR}="${skin.id}"]`;
      const scopedRules = skin.rules
        .map(({ sel, decl }) => `${scope} ${sel} {\n${decl}\n}`)
        .join('\n\n');

      const tailColorRules = skin.noTail
        ? ''
        : [
            `${scope} ${BUBBLE_TARGET} {\n  --dsb-tail-bg: ${skin.tailColor};\n}`,
            skin.tailColorDark
              ? `${scope} body[data-ds-dark-theme] ${BUBBLE_TARGET} {\n  --dsb-tail-bg: ${skin.tailColorDark};\n}`
              : '',
          ]
            .filter(Boolean)
            .join('\n\n');

      const tailRule = skin.noTail
        ? ''
        : `${scope}[${TAIL_ATTR}="on"] ${BUBBLE_TARGET}::after {\n  content: '';\n  position: absolute;\n  right: -6px;\n  bottom: 4px;\n  width: 12px;\n  height: 12px;\n  background: var(--dsb-tail-bg);\n  clip-path: polygon(0 0, 100% 100%, 0 100%);\n  border-radius: 1px;\n  pointer-events: none;\n}`;

      // 设置行控件（下拉 / 开关）的交互态：样式对齐宿主官方控件。
      const controlRules = [
        `${scope} .dsb-select-button:hover { background: var(--dsw-alias-interactive-bg-hover); }`,
        `${scope} .dsb-select-button:focus-visible { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 2px; }`,
        `${scope} .dsb-menu-item:hover { background: var(--dsw-alias-interactive-bg-hover); }`,
        `${scope} .dsb-menu-item:focus-visible { background: var(--dsw-alias-interactive-bg-hover); outline: none; }`,
        `${scope} .dsb-switch:focus-visible { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 2px; }`,
        // DSH 全局用 corner-shape: superellipse(1.5) 平滑圆角，开关需显式恢复正圆胶囊。
        `${scope} .dsb-switch, ${scope} .dsb-switch > span { corner-shape: round; }`,
        `${scope} .dsb-image-button:hover { background: var(--dsw-alias-interactive-bg-hover); }`,
        `${scope} .dsb-image-button:focus-visible { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 2px; }`,
        `${scope} .dsb-image-icon:hover { background: var(--dsw-alias-interactive-bg-hover); }`,
        `${scope} .dsb-image-icon:focus-visible { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 2px; }`,
      ].join('\n');

      // M2 demo 的图片背景/形状/字体规则已并入「自定义图片」样式（buildCustomSkin），
      // 内置皮肤的图案与装饰保持完整，不再被图片模式覆盖（用户反馈 2026-10-20）。

      return `${scope} {\n  --dsh-bubble-skin-active: "${skin.id}";\n}\n\n${scopedRules}\n\n${tailColorRules}\n\n${tailRule}\n\n${controlRules}\n`;
    }

    /** 当前注入的 style 元素，卸载时用于清理。 */
    let styleElement = null;

    /**
     * 确保页面中存在由本插件拥有的 style 元素。
     *
     * 处理三类异常路径：
     * - 已存在同 id 且归属正确的节点：直接复用；
     * - 已存在同 id 但归属错误 / 无归属的旧节点：移除后重建；
     * - 节点曾被外部移除（脱离文档）：重新挂载。
     *
     * @returns {HTMLStyleElement} 可写入的 style 元素。
     */
    function ensureStyleElement() {
      const parent = document.head || document.documentElement;
      let element = document.getElementById(STYLE_ID);

      if (!element || element.getAttribute('data-plugin') !== STYLE_OWNER) {
        if (element && element.parentNode) element.parentNode.removeChild(element);
        element = document.createElement('style');
        element.id = STYLE_ID;
        element.setAttribute('data-plugin', STYLE_OWNER);
        element.setAttribute('data-dsh-bubble-skins', 'true');
      }

      if (!element.isConnected) parent.appendChild(element);
      return element;
    }

    /**
     * 挂载（或热替换）某套皮肤。
     *
     * @param {string} skinId 皮肤 id。
     * @returns {boolean} 是否成功挂载。
     */
    function mount(skinId) {
      const skin = skinId === CUSTOM_STYLE_ID ? buildCustomSkin() : SKIN_MAP.get(skinId);
      if (!skin) return false;

      styleElement = ensureStyleElement();
      styleElement.textContent = buildCss(skin);
      document.documentElement.setAttribute(ROOT_ATTR, skin.id);
      notify();
      return true;
    }

    /**
     * 卸载皮肤：移除全部归属本插件的 style、根属性与尾巴属性，恢复产品默认外观。
     *
     * @returns {void}
     */
    function unmount() {
      document.querySelectorAll(`style[data-plugin="${STYLE_OWNER}"]`).forEach((node) => node.remove());
      const byId = document.getElementById(STYLE_ID);
      if (byId) byId.remove();
      document.documentElement.removeAttribute(ROOT_ATTR);
      document.documentElement.removeAttribute(TAIL_ATTR);
      for (const name of [
        '--dsb-bg-image',
        '--dsb-bg-fit',
        '--dsb-image-fg',
        '--dsb-image-shadow',
        '--dsb-image-tail',
      ]) {
        document.documentElement.style.removeProperty(name);
      }
      for (const slot of DECOR_SLOTS) {
        document.documentElement.style.removeProperty(`--dsb-deco-${slot.id}-image`);
        document.documentElement.style.removeProperty(`--dsb-deco-${slot.id}-size`);
      }
      styleElement = null;
      notify();
    }

    /**
     * 切换皮肤（持久化 + 立即生效）。
     *
     * @param {string} skinId 皮肤 id。
     * @returns {boolean} 是否切换成功。
     */
    function setSkin(skinId) {
      if (skinId === CUSTOM_STYLE_ID && !CUSTOM_BUBBLES_ENABLED) return false;
      if (skinId !== CUSTOM_STYLE_ID && !SKIN_MAP.has(skinId)) return false;
      writeActiveId(skinId);
      return mount(skinId);
    }

    /**
     * 切换尾巴开关（持久化 + 立即生效，无需重建样式表）。
     *
     * @param {boolean} enabled 是否显示尾巴。
     * @returns {boolean} 切换后的状态。
     */
    function setTail(enabled) {
      if (!TAIL_FEATURE_ENABLED) {
        tailEnabled = false;
        applyTailAttribute(false);
        notify();
        return false;
      }
      tailEnabled = Boolean(enabled);
      writeTailEnabled(tailEnabled);
      applyTailAttribute(tailEnabled);
      notify();
      return tailEnabled;
    }

    /** 对外暴露的运行时 API（控制台调试 + 设置行共用）。 */
    const api = {
      /** 调试 API 版本。 */
      version: API_VERSION,
      /** 当前皮肤 id。 */
      get current() {
        return document.documentElement.getAttribute(ROOT_ATTR) || null;
      },
      /** 当前是否显示尾巴。 */
      get tail() {
        return tailEnabled;
      },
      /** 当前分层样式的背景图 data URI（未设置为 null）。 */
      get image() {
        return imageDataUrl;
      },
      /** 分层样式是否已有背景或装饰。 */
      get hasImage() {
        return hasAnyLayer();
      },
      /** 是否刚停用了 v1 九宫格旧素材（设置行会提示重新上传）。 */
      get legacyReset() {
        return legacyImageReset;
      },
      /** 当前背景是否被识别为整张完整气泡图（使用 cover 裁剪）。 */
      get backgroundLooksLikeBubble() {
        return backgroundLooksLikeBubble;
      },
      /** 当前装饰槽位（只读副本）。 */
      get decorations() {
        return {
          tl: decorations.tl ? { ...decorations.tl } : null,
          tr: decorations.tr ? { ...decorations.tr } : null,
          bl: decorations.bl ? { ...decorations.bl } : null,
          br: decorations.br ? { ...decorations.br } : null,
          bc: decorations.bc ? { ...decorations.bc } : null,
        };
      },
      /** 可用样式列表（当前只开放固定样式；自定义入口隐藏）。 */
      list: SKINS.map((skin) => ({ id: skin.id, name: skin.name, description: skin.description })).concat(
        CUSTOM_BUBBLES_ENABLED
          ? [
              {
                id: CUSTOM_STYLE_ID,
                name: { zh: '自定义图片', en: 'Custom image' },
                description: {
                  zh: '分层气泡：可拉伸背景 + 固定装饰 + 独立尾巴。',
                  en: 'Layered bubble: stretchable background + fixed decorations + independent tail.',
                },
              },
            ]
          : [],
      ),
      /** 切换样式。 */
      set: setSkin,
      /** 切换尾巴。 */
      setTail,
      /** 设置背景层（会切换到自定义样式）。 */
      setBackground,
      /** 清除背景层。 */
      clearBackground,
      /** 设置某个锚点的装饰。 */
      setDecoration,
      /** 清除某个锚点的装饰。 */
      clearDecoration,
      /** 订阅当前样式 / 尾巴 / 背景 / 装饰变化。 */
      subscribe,
    };

    /** 设置行内联样式（与宿主 General 设置行的官方样式保持一致）。 */
    const rowStyles = {
      row: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 0',
        borderBottom: '0.5px solid var(--dsw-alias-border-l2)',
        boxSizing: 'border-box',
      },
      text: {
        display: 'flex',
        flexDirection: 'column',
        flex: '1',
        gap: '4px',
        minWidth: 0,
        paddingRight: '48px',
      },
      label: {
        color: 'var(--dsw-alias-label-primary)',
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: '22px',
      },
      description: {
        color: 'var(--dsw-alias-label-tertiary)',
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: '18px',
      },
    };

    /** 官方风格下拉（按钮 + 自定义菜单，尺寸/材质/条目均对齐宿主 Menu 与 PreferenceRow）。 */
    const selectStyles = {
      wrap: {
        position: 'relative',
        display: 'inline-flex',
        flex: 'none',
      },
      button: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        height: '36px',
        padding: '0 14px',
        border: 'none',
        borderRadius: 'var(--dsw-radius-md)',
        background: 'var(--dsw-alias-bg-module-platform)',
        color: 'var(--dsw-alias-label-primary)',
        font: 'inherit',
        fontSize: '14px',
        lineHeight: '22px',
        cursor: 'pointer',
        flex: 'none',
      },
      value: {
        whiteSpace: 'nowrap',
      },
      chevron: {
        flex: 'none',
        transition: 'transform 0.12s',
      },
      menu: {
        position: 'absolute',
        top: 'calc(100% + 4px)',
        right: 0,
        zIndex: 100,
        boxSizing: 'border-box',
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        border: 'none',
        minWidth: '144px',
        maxWidth: '360px',
        borderRadius: 'var(--dsw-radius-lg)',
        background: 'var(--dsw-menu-surface-fill)',
        backdropFilter: 'var(--dsw-menu-backdrop-filter)',
        boxShadow: 'var(--dsw-elevation-prominent)',
        '--dsw-elevation-stroke-color': 'var(--dsw-alias-border-l1)',
      },
      menuItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        width: '100%',
        minHeight: '34px',
        padding: '6px 8px',
        border: 'none',
        borderRadius: 'var(--dsw-radius-md)',
        background: 'transparent',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: '13px',
        lineHeight: '20px',
        color: 'var(--dsw-alias-label-primary)',
        textAlign: 'left',
      },
      menuItemLabel: {
        flex: '1',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      check: {
        flex: 'none',
        color: 'var(--dsw-alias-label-primary)',
      },
    };

    /** 官方风格开关（胶囊轨道 + 圆形滑块，尺寸与色值对齐宿主 Switch）。 */
    const toggleStyles = {
      track: {
        boxSizing: 'border-box',
        position: 'relative',
        flex: '0 0 auto',
        width: '36px',
        height: '20px',
        padding: '2px',
        border: 'none',
        borderRadius: '999px',
        cursor: 'pointer',
        display: 'block',
      },
      thumb: {
        display: 'block',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        transition: 'transform 0.12s ease',
      },
    };

    /** 图片气泡行的控件样式（官方按钮 / 缩略图风格）。 */
    const imageStyles = {
      control: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        gap: '8px',
        flex: 'none',
      },
      preview: {
        width: '32px',
        height: '32px',
        flex: 'none',
        borderRadius: '8px',
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-module-platform) center / cover no-repeat',
        display: 'block',
      },
      button: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '32px',
        padding: '0 12px',
        border: 'none',
        borderRadius: 'var(--dsw-radius-md)',
        background: 'var(--dsw-alias-bg-module-platform)',
        color: 'var(--dsw-alias-label-primary)',
        font: 'inherit',
        fontSize: '13px',
        lineHeight: '20px',
        cursor: 'pointer',
        flex: 'none',
      },
      iconButton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        padding: 0,
        border: 'none',
        borderRadius: 'var(--dsw-radius-md)',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        cursor: 'pointer',
        flex: 'none',
      },
      decorGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        flex: 'none',
      },
      decorThumb: {
        width: '20px',
        height: '20px',
        flex: 'none',
        borderRadius: '4px',
        background: 'transparent center / contain no-repeat',
        display: 'block',
      },
      hiddenInput: {
        display: 'none',
      },
    };

    /**
     * 通用设置行外壳：左侧标题 + 描述，右侧控件。
     *
     * @param {{ label: string, description: string, control: import('react').ReactNode }} props 行内容。
     * @returns {import('react').ReactElement} 行节点。
     */
    function SettingRow(props) {
      return React.createElement(
        'div',
        { style: rowStyles.row },
        React.createElement(
          'div',
          { style: rowStyles.text },
          React.createElement('div', { style: rowStyles.label }, props.label),
          React.createElement('div', { style: rowStyles.description }, props.description),
        ),
        props.control,
      );
    }

    /**
     * 官方风格下拉控件（按钮 + 自定义菜单）。
     *
     * 交互：点击展开/收起；选择后立即应用并关闭；点击外部或 Escape 关闭。
     * 视觉：面板/条目尺寸、圆角、材质、字号与宿主 Menu 一致。
     *
     * @param {{ value: string, options: Array<{ value: string, label: string }>, ariaLabel: string, onChange: (value: string) => void }} props 控件属性。
     * @returns {import('react').ReactElement} 下拉节点。
     */
    function SelectPill(props) {
      const [open, setOpen] = React.useState(false);
      const rootRef = React.useRef(null);
      const buttonRef = React.useRef(null);

      React.useEffect(() => {
        if (!open) return undefined;

        /** @param {PointerEvent} event 指针事件 @returns {void} */
        const handlePointerDown = (event) => {
          if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
        };

        /** @param {KeyboardEvent} event 键盘事件 @returns {void} */
        const handleKeyDown = (event) => {
          if (event.key !== 'Escape') return;
          setOpen(false);
          const button = buttonRef.current;
          if (button && typeof button.focus === 'function') button.focus();
        };

        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
          document.removeEventListener('pointerdown', handlePointerDown, true);
          document.removeEventListener('keydown', handleKeyDown, true);
        };
      }, [open]);

      const activeOption = props.options.find((option) => option.value === props.value);

      return React.createElement(
        'div',
        { ref: rootRef, className: 'dsb-select', style: selectStyles.wrap },
        React.createElement(
          'button',
          {
            ref: buttonRef,
            type: 'button',
            className: 'dsb-select-button',
            style: selectStyles.button,
            onClick: () => setOpen(!open),
            'aria-haspopup': 'listbox',
            'aria-expanded': open,
            'aria-label': props.ariaLabel,
          },
          React.createElement('span', { style: selectStyles.value }, activeOption ? activeOption.label : props.value),
          React.createElement(
            'svg',
            {
              width: 16,
              height: 16,
              viewBox: '0 0 16 16',
              'aria-hidden': true,
              style: { ...selectStyles.chevron, transform: open ? 'rotate(180deg)' : 'none' },
            },
            React.createElement('path', {
              d: 'M4 6 L8 10 L12 6',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.5,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }),
          ),
        ),
        open
          ? React.createElement(
              'div',
              { role: 'listbox', className: 'dsb-select-menu', style: selectStyles.menu },
              props.options.map((option) =>
                React.createElement(
                  'button',
                  {
                    key: option.value,
                    type: 'button',
                    role: 'option',
                    'aria-selected': option.value === props.value,
                    className: 'dsb-menu-item',
                    style: selectStyles.menuItem,
                    onClick: () => {
                      props.onChange(option.value);
                      setOpen(false);
                      const button = buttonRef.current;
                      if (button && typeof button.focus === 'function') button.focus();
                    },
                  },
                  React.createElement('span', { style: selectStyles.menuItemLabel }, option.label),
                  option.value === props.value
                    ? React.createElement(
                        'svg',
                        {
                          width: 14,
                          height: 14,
                          viewBox: '0 0 16 16',
                          'aria-hidden': true,
                          style: selectStyles.check,
                        },
                        React.createElement('path', {
                          d: 'M3.5 8.5 L6.5 11.5 L12.5 4.5',
                          fill: 'none',
                          stroke: 'currentColor',
                          strokeWidth: 1.5,
                          strokeLinecap: 'round',
                          strokeLinejoin: 'round',
                        }),
                      )
                    : null,
                ),
              ),
            )
          : null,
      );
    }

    /**
     * 官方风格开关控件。
     *
     * @param {{ checked: boolean, ariaLabel: string, onChange: (next: boolean) => void }} props 控件属性。
     * @returns {import('react').ReactElement} 开关节点。
     */
    function ToggleSwitch(props) {
      /** @returns {void} */
      function handleClick() {
        props.onChange(!props.checked);
      }

      return React.createElement(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': props.checked,
          'aria-label': props.ariaLabel,
          onClick: handleClick,
          className: 'dsb-switch',
          style: {
            ...toggleStyles.track,
            background: props.checked
              ? 'var(--dsw-alias-brand-primary)'
              : 'var(--dsw-alias-border-l3)',
          },
        },
        React.createElement('span', {
          style: {
            ...toggleStyles.thumb,
            background: props.checked
              ? 'var(--dsw-alias-label-primary-foreground)'
              : 'var(--dsw-alias-switch-thumb)',
            transform: props.checked ? 'translate(16px)' : 'translate(0)',
          },
        }),
      );
    }

    /**
     * 「设置 → 通用 → 气泡样式」一行。
     *
     * 该 slot 的 owner 不传 props；行自己负责标题、描述、当前值与写入。
     * 注册时声明 `locale: LOCALE_NS`，因此由宿主注入已绑定的 `t`。
     *
     * @param {{ t?: (key: string) => string }} props slot 注入的本地化翻译函数。
     * @returns {import('react').ReactElement} 设置行节点。
     */
    function BubbleStyleRow(props = {}) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const [current, setCurrent] = React.useState(() => api.current || DEFAULT_SKIN);

      React.useEffect(() => api.subscribe(() => setCurrent(api.current || DEFAULT_SKIN)), []);

      /**
       * @param {string} skinId 选中的皮肤 id。
       * @returns {void}
       */
      function handleSkinChange(skinId) {
        api.set(skinId);
      }

      const options = SKINS.map((skin) => ({ value: skin.id, label: t(skin.id) }));
      if (CUSTOM_BUBBLES_ENABLED) options.push({ value: CUSTOM_STYLE_ID, label: t('customStyle') });

      return React.createElement(SettingRow, {
        label: t('label'),
        description: t('description'),
        control: React.createElement(SelectPill, {
          value: current,
          options,
          ariaLabel: t('label'),
          onChange: handleSkinChange,
        }),
      });
    }

    /**
     * 「设置 → 通用 → 气泡尾巴」一行。
     *
     * @param {{ t?: (key: string) => string }} props slot 注入的本地化翻译函数。
     * @returns {import('react').ReactElement} 设置行节点。
     */
    function BubbleTailRow(props = {}) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const [enabled, setEnabled] = React.useState(() => api.tail);

      React.useEffect(() => api.subscribe(() => setEnabled(api.tail)), []);

      /**
       * @param {boolean} next 期望状态。
       * @returns {void}
       */
      function handleTailChange(next) {
        api.setTail(next);
      }

      return React.createElement(SettingRow, {
        label: t('tailLabel'),
        description: t('tailDescription'),
        control: React.createElement(ToggleSwitch, {
          checked: enabled,
          ariaLabel: t('tailLabel'),
          onChange: handleTailChange,
        }),
      });
    }

    /**
     * 把 sRGB 通道值转为 WCAG 相对亮度分量。
     *
     * @param {number} value 0–255 通道值。
     * @returns {number} 线性化后的分量。
     */
    function linearizeChannel(value) {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }

    /**
     * 估算画布平均相对亮度，并按 WCAG 对比度选择黑/白文字。
     *
     * 对比度：
     * - 白字 = `1.05 / (L + 0.05)`
     * - 黑字（#1b1b1b）= `(L + 0.05) / 0.06096`
     * 取对比度更高者；两者交叉点约 L = 0.203（不是拍脑袋的 0.62）。
     *
     * @param {HTMLCanvasElement} canvas 画布。
     * @returns {string} `#1b1b1b`（浅色图）或 `#ffffff`（深色图）。
     */
    function pickForegroundColor(canvas) {
      try {
        const sample = document.createElement('canvas');
        sample.width = 8;
        sample.height = 8;
        const context = sample.getContext('2d');
        if (!context) return '#ffffff';
        context.drawImage(canvas, 0, 0, 8, 8);
        const pixels = context.getImageData(0, 0, 8, 8).data;
        let sumLuminance = 0;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] < 16) continue;
          const r = linearizeChannel(pixels[i]);
          const g = linearizeChannel(pixels[i + 1]);
          const b = linearizeChannel(pixels[i + 2]);
          sumLuminance += 0.2126 * r + 0.7152 * g + 0.0722 * b;
          count += 1;
        }
        const luminance = count > 0 ? sumLuminance / count : 0;
        const whiteContrast = 1.05 / (luminance + 0.05);
        const blackContrast = (luminance + 0.05) / 0.06096;
        return blackContrast >= whiteContrast ? '#1b1b1b' : '#ffffff';
      } catch {
        return '#ffffff';
      }
    }

    /**
     * 从图片右下角取样尾巴颜色，让尾巴尽量与图案融为一体。
     *
     * @param {HTMLCanvasElement} canvas 画布。
     * @returns {string} CSS 颜色（rgb(...)）。
     */
    function pickTailColor(canvas) {
      try {
        const context = canvas.getContext('2d');
        if (!context) return DEFAULT_TAIL_COLOR;
        const startX = Math.max(0, Math.floor(canvas.width * 0.85));
        const startY = Math.max(0, Math.floor(canvas.height * 0.6));
        const width = Math.max(1, canvas.width - startX);
        const height = Math.max(1, canvas.height - startY);
        const pixels = context.getImageData(startX, startY, width, height).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] < 16) continue;
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          count += 1;
        }
        if (count === 0) return DEFAULT_TAIL_COLOR;
        return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
      } catch {
        return DEFAULT_TAIL_COLOR;
      }
    }

    /**
     * 把与图片外边缘连通的纯色背景变为透明。
     *
     * 解决「白底气泡图」在九宫格四角留下白块的问题；只处理与外边缘连通的背景，
     * 气泡内部同色装饰（如白色描边、文字）不会被误删。
     *
     * @param {HTMLCanvasElement} canvas 画布（原地修改）。
     * @returns {HTMLCanvasElement} 传入的画布。
     */
    function removeConnectedBackground(canvas) {
      try {
        const context = canvas.getContext('2d');
        if (!context) return canvas;
        const width = canvas.width;
        const height = canvas.height;
        if (width < 8 || height < 8) return canvas;
        const image = context.getImageData(0, 0, width, height);
        const pixels = image.data;

        /**
         * 读取像素。
         *
         * @param {number} x 横坐标。 @param {number} y 纵坐标。
         * @returns {number[]} RGBA。
         */
        const read = (x, y) => {
          const index = (y * width + x) * 4;
          return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
        };

        const corners = [read(0, 0), read(width - 1, 0), read(0, height - 1), read(width - 1, height - 1)];
        /**
         * 判断两个颜色是否接近。
         *
         * @param {number[]} a 颜色 A。 @param {number[]} b 颜色 B。
         * @returns {boolean} 是否接近。
         */
        const closeColor = (a, b) => a.every((value, channel) => Math.abs(value - b[channel]) <= 18);
        let background = null;
        let bestCount = 0;
        for (const candidate of corners) {
          const count = corners.filter((corner) => closeColor(corner, candidate)).length;
          if (count > bestCount) {
            bestCount = count;
            background = candidate;
          }
        }
        // 至少 3 个角一致才认为是「纯色背景」，避免误删照片内容。
        if (!background || bestCount < 3) return canvas;
        if (background[3] < 16) return canvas;

        /**
         * 判断像素是否属于背景色。
         *
         * @param {number} index 像素起始索引。
         * @returns {boolean} 是否背景。
         */
        const isBackground = (index) => {
          if (pixels[index + 3] < 24) return true;
          return (
            Math.abs(pixels[index] - background[0]) <= 18 &&
            Math.abs(pixels[index + 1] - background[1]) <= 18 &&
            Math.abs(pixels[index + 2] - background[2]) <= 18
          );
        };

        // 中心点是不透明的背景色 → 图片很可能本身就是纯色/没有主体，跳过以免整图透明。
        // （中心透明则说明气泡本体可能是镂空材质，仍应继续去底。）
        const centerIndex = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4;
        if (pixels[centerIndex + 3] >= 24 && isBackground(centerIndex)) return canvas;

        // 从四边做 BFS，仅清除与外部连通的背景。
        const visited = new Uint8Array(width * height);
        const queue = [];
        for (let x = 0; x < width; x += 1) {
          queue.push(x, (height - 1) * width + x);
        }
        for (let y = 0; y < height; y += 1) {
          queue.push(y * width, y * width + width - 1);
        }
        while (queue.length > 0) {
          const position = queue.pop();
          if (visited[position]) continue;
          visited[position] = 1;
          const index = position * 4;
          if (!isBackground(index)) continue;
          pixels[index + 3] = 0;
          const x = position % width;
          const y = Math.floor(position / width);
          if (x > 0) queue.push(position - 1);
          if (x < width - 1) queue.push(position + 1);
          if (y > 0) queue.push(position - width);
          if (y < height - 1) queue.push(position + width);
        }

        context.putImageData(image, 0, 0);
        return canvas;
      } catch {
        return canvas;
      }
    }

    /**
     * 裁掉图片四周与四角同色的留白（白边 / 透明边），避免图案与气泡之间出现空白。
     *
     * @param {HTMLCanvasElement} canvas 源画布。
     * @returns {HTMLCanvasElement|null} 裁剪后的画布；无法安全裁剪时返回 null。
     */
    function trimCanvasMargins(canvas) {
      try {
        const context = canvas.getContext('2d');
        if (!context) return null;
        const width = canvas.width;
        const height = canvas.height;
        if (width < 8 || height < 8) return null;
        const pixels = context.getImageData(0, 0, width, height).data;

        /**
         * 读取某像素的 RGBA。
         *
         * @param {number} x 横坐标。 @param {number} y 纵坐标。
         * @returns {[number, number, number, number]} RGBA。
         */
        const read = (x, y) => {
          const index = (y * width + x) * 4;
          return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
        };

        const corners = [read(0, 0), read(width - 1, 0), read(0, height - 1), read(width - 1, height - 1)];
        /**
         * 判断两个颜色是否接近。
         *
         * @param {number[]} a 颜色 A。 @param {number[]} b 颜色 B。
         * @returns {boolean} 是否接近。
         */
        const closeColor = (a, b) => a.every((value, channel) => Math.abs(value - b[channel]) <= 16);
        // 用「多数一致的角」作为背景色：至少两个角一致才认为是留白，避免误裁照片。
        let background = null;
        let bestCount = 0;
        for (const candidate of corners) {
          const count = corners.filter((corner) => closeColor(corner, candidate)).length;
          if (count > bestCount) {
            bestCount = count;
            background = candidate;
          }
        }
        if (!background || bestCount < 2) return null;

        /**
         * 判断像素是否属于背景。
         *
         * @param {number} x 横坐标。 @param {number} y 纵坐标。
         * @returns {boolean} 是否背景。
         */
        const isBackground = (x, y) => {
          const [r, g, b, a] = read(x, y);
          if (Math.abs(a - background[3]) > 24) return false;
          if (background[3] < 16) return true;
          return (
            Math.abs(r - background[0]) <= 16 &&
            Math.abs(g - background[1]) <= 16 &&
            Math.abs(b - background[2]) <= 16
          );
        };

        /**
         * 判断整行 / 整列是否都是背景。
         *
         * @param {number} start 行号或列号。
         * @param {boolean} isRow 是否按行扫描。
         * @returns {boolean} 是否整条都是背景。
         */
        const lineIsBackground = (start, isRow) => {
          const length = isRow ? width : height;
          for (let i = 0; i < length; i += 1) {
            const x = isRow ? i : start;
            const y = isRow ? start : i;
            if (!isBackground(x, y)) return false;
          }
          return true;
        };

        let top = 0;
        while (top < height && lineIsBackground(top, true)) top += 1;
        if (top >= height) return null;
        let bottom = height - 1;
        while (bottom > top && lineIsBackground(bottom, true)) bottom -= 1;
        let left = 0;
        while (left < width && lineIsBackground(left, false)) left += 1;
        if (left >= width) return null;
        let right = width - 1;
        while (right > left && lineIsBackground(right, false)) right -= 1;

        if (top === 0 && bottom === height - 1 && left === 0 && right === width - 1) return null;
        const targetWidth = right - left + 1;
        const targetHeight = bottom - top + 1;
        if (targetWidth < 8 || targetHeight < 8) return null;

        const cropped = document.createElement('canvas');
        cropped.width = targetWidth;
        cropped.height = targetHeight;
        const croppedContext = cropped.getContext('2d');
        if (!croppedContext) return null;
        croppedContext.drawImage(canvas, left, top, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
        return cropped;
      } catch {
        return null;
      }
    }

    /**
     * 统计画布四角是否透明，用于判断背景是不是「整张气泡图」。
     *
     * 普通渐变/纹理背景四角不透明；完整气泡图裁掉透明边后四角仍透明。
     *
     * @param {HTMLCanvasElement} canvas 目标画布。
     * @returns {number} 透明角的数量（0–4）。
     */
    function countTransparentCorners(canvas) {
      try {
        const context = canvas.getContext('2d');
        if (!context) return 0;
        const points = [
          [0, 0],
          [canvas.width - 1, 0],
          [0, canvas.height - 1],
          [canvas.width - 1, canvas.height - 1],
        ];
        let count = 0;
        for (const [x, y] of points) {
          if (x < 0 || y < 0) continue;
          const data = context.getImageData(x, y, 1, 1).data;
          if (data[3] < 16) count += 1;
        }
        return count;
      } catch {
        return 0;
      }
    }

    /**
     * 异步检测已存储背景是否像整张完整气泡图（用于升级后旧背景自动切换到 cover）。
     *
     * @param {string} dataUrl 背景图 data URI。
     * @returns {Promise<boolean>} 是否像整张气泡图。
     */
    function detectBubbleLikeBackground(dataUrl) {
      return new Promise((resolve) => {
        try {
          const image = new Image();
          image.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = Math.max(1, image.width);
              canvas.height = Math.max(1, image.height);
              const context = canvas.getContext('2d');
              if (!context) {
                resolve(false);
                return;
              }
              context.drawImage(image, 0, 0);
              resolve(countTransparentCorners(canvas) >= 2);
            } catch {
              resolve(false);
            }
          };
          image.onerror = () => resolve(false);
          image.src = dataUrl;
        } catch {
          resolve(false);
        }
      });
    }

    /**
     * 把图片压缩为 data URI，并可按需计算文字色与尾巴颜色。
     *
     * 处理顺序：缩放 →（可选）裁掉纯色/透明留白 → 编码 → 取色。
     * 背景层会开启裁剪/去底/取色；装饰层需保留原始画布（含透明留白），因此关闭这些步骤。
     *
     * @param {File} file 用户选择的图片文件。
     * @param {{ trim?: boolean }} [options] 处理选项；`trim` 默认 true。
     * @returns {Promise<{ dataUrl: string, foreground: string, tailColor: string, width: number, height: number }>} 压缩结果。
     */
    function compressImage(file, options = {}) {
      const trim = options.trim !== false;
      return new Promise((resolve, reject) => {
        if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) {
          reject(new Error('not-image'));
          return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error('read-failed'));
        reader.onload = () => {
          const source = new Image();
          source.onerror = () => reject(new Error('decode-failed'));
          source.onload = () => {
            try {
              const longest = Math.max(source.width, source.height) || 1;
              const scale = longest > IMAGE_MAX_EDGE ? IMAGE_MAX_EDGE / longest : 1;
              const baseWidth = Math.max(1, Math.round(source.width * scale));
              const baseHeight = Math.max(1, Math.round(source.height * scale));

              const baseCanvas = document.createElement('canvas');
              baseCanvas.width = baseWidth;
              baseCanvas.height = baseHeight;
              const baseContext = baseCanvas.getContext('2d');
              if (!baseContext) throw new Error('canvas-unavailable');
              baseContext.drawImage(source, 0, 0, baseWidth, baseHeight);

              const cropped = trim ? trimCanvasMargins(baseCanvas) : null;
              const finalCanvas = trim ? removeConnectedBackground(cropped || baseCanvas) : baseCanvas;
              const finalWidth = finalCanvas.width;
              const finalHeight = finalCanvas.height;

              /**
               * 把最终画布按目标尺寸编码一次。
               *
               * @param {number} width 目标宽。 @param {number} height 目标高。
               * @returns {string} data URI。
               */
              const encode = (width, height) => {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext('2d');
                if (!context) throw new Error('canvas-unavailable');
                context.drawImage(finalCanvas, 0, 0, width, height);
                const webp = canvas.toDataURL('image/webp', 0.85);
                if (webp.startsWith('data:image/webp')) return webp;
                // 装饰层需要透明通道，WebP 不可用时回退 PNG；背景层可用 JPEG 压体积。
                return trim ? canvas.toDataURL('image/jpeg', 0.85) : canvas.toDataURL('image/png');
              };

              let dataUrl = encode(finalWidth, finalHeight);
              let shrink = 0.75;
              while (dataUrl.length > MAX_IMAGE_CHARS && shrink >= 0.25) {
                dataUrl = encode(
                  Math.max(1, Math.round(finalWidth * shrink)),
                  Math.max(1, Math.round(finalHeight * shrink)),
                );
                shrink -= 0.15;
              }
              if (dataUrl.length > MAX_IMAGE_CHARS) {
                reject(new Error('image-too-large'));
                return;
              }

              resolve({
                dataUrl,
                foreground: trim ? pickForegroundColor(finalCanvas) : '#ffffff',
                tailColor: trim ? pickTailColor(finalCanvas) : DEFAULT_TAIL_COLOR,
                width: finalWidth,
                height: finalHeight,
                transparentCorners: trim ? countTransparentCorners(finalCanvas) : 0,
              });
            } catch (error) {
              reject(error);
            }
          };
          source.src = String(reader.result);
        };
        reader.readAsDataURL(file);
      });
    }

    /**
     * 「设置 → 通用 → 气泡背景」一行（M2 分层模型）。
     *
     * 背景层会拉伸铺满气泡；装饰/花纹由下一行「气泡装饰」负责。
     *
     * @param {{ t?: (key: string) => string }} props slot 注入的本地化翻译函数。
     * @returns {import('react').ReactElement} 设置行节点。
     */
    function BubbleImageRow(props = {}) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const [image, setImageState] = React.useState(() => api.image);
      const [current, setCurrentState] = React.useState(() => api.current);
      const [error, setErrorState] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const inputRef = React.useRef(null);

      React.useEffect(
        () =>
          api.subscribe(() => {
            setImageState(api.image);
            setCurrentState(api.current);
          }),
        [],
      );

      /** @returns {void} 打开系统文件选择框。 */
      function handlePick() {
        const input = inputRef.current;
        if (input && typeof input.click === 'function') input.click();
      }

      /**
       * 处理选中的背景图（压缩/裁留白/去底后保存）。
       *
       * @param {import('react').ChangeEvent<HTMLInputElement>} event 文件选择事件。
       * @returns {void}
       */
      function handleFile(event) {
        const target = event.currentTarget;
        const file = target.files && target.files[0];
        if (!file) return;
        setErrorState(null);
        setBusy(true);
        compressImage(file)
          .then((result) => {
            try {
              api.setBackground(
                result.dataUrl,
                result.foreground,
                result.tailColor,
                result.transparentCorners >= 2,
              );
            } catch {
              setErrorState(t('imageTooLarge'));
            }
          })
          .catch(() => setErrorState(t('imageError')))
          .finally(() => {
            setBusy(false);
            if (target) target.value = '';
          });
      }

      /** @returns {void} 使用内置示例背景。 */
      function handleDemo() {
        setErrorState(null);
        try {
          api.setBackground(DEMO_IMAGE, '#ffffff', DEMO_TAIL_COLOR);
        } catch {
          setErrorState(t('imageError'));
        }
      }

      /** @returns {void} 清除背景层。 */
      function handleClear() {
        setErrorState(null);
        api.clearBackground();
      }

      const controls = [];
      if (image) {
        controls.push(
          React.createElement('span', {
            key: 'preview',
            style: { ...imageStyles.preview, backgroundImage: `url("${image}")` },
            'aria-hidden': true,
          }),
        );
      }
      controls.push(
        React.createElement(
          'button',
          {
            key: 'pick',
            type: 'button',
            className: 'dsb-image-button',
            style: imageStyles.button,
            onClick: handlePick,
            disabled: busy,
          },
          busy ? t('imageBusy') : image ? t('imageChange') : t('imagePick'),
        ),
      );
      if (!image) {
        controls.push(
          React.createElement(
            'button',
            {
              key: 'demo',
              type: 'button',
              className: 'dsb-image-button',
              style: imageStyles.button,
              onClick: handleDemo,
            },
            t('imageDemo'),
          ),
        );
      }
      if (image) {
        controls.push(
          React.createElement(
            'button',
            {
              key: 'clear',
              type: 'button',
              className: 'dsb-image-icon',
              style: imageStyles.iconButton,
              onClick: handleClear,
              'aria-label': t('imageClear'),
            },
            React.createElement(
              'svg',
              { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': true },
              React.createElement('path', {
                d: 'M4 4 L12 12 M12 4 L4 12',
                stroke: 'currentColor',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
              }),
            ),
          ),
        );
      }

      let description = t('imageDescription');
      if (api.legacyReset) description = `${description} ${t('imageLegacyHint')}`;
      if (api.backgroundLooksLikeBubble) description = `${description} ${t('imageBubbleLikeHint')}`;
      if (image && current !== CUSTOM_STYLE_ID) description = `${description} ${t('imageInactiveHint')}`;
      if (error) description = `${description}（${error}）`;

      return React.createElement(SettingRow, {
        label: t('imageLabel'),
        description,
        control: React.createElement(
          'div',
          { style: imageStyles.control },
          controls,
          React.createElement('input', {
            ref: inputRef,
            type: 'file',
            accept: 'image/*',
            style: imageStyles.hiddenInput,
            onChange: handleFile,
            tabIndex: -1,
            'aria-hidden': true,
          }),
        ),
      });
    }

    /**
     * 「设置 → 通用 → 气泡装饰」一行（M2 分层模型）。
     *
     * 5 个锚点槽位（左上/右上/左下/右下/底部），每个装饰按 @2x 图片尺寸的一半显示，
     * 通过 CSS multi-background 固定在气泡上，不随文字/气泡尺寸拉伸。
     *
     * @param {{ t?: (key: string) => string }} props slot 注入的本地化翻译函数。
     * @returns {import('react').ReactElement} 设置行节点。
     */
    function BubbleDecorRow(props = {}) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const [items, setItems] = React.useState(() => api.decorations);
      const [error, setErrorState] = React.useState(null);
      const [busySlot, setBusySlot] = React.useState(null);
      const inputRef = React.useRef(null);
      const pendingSlotRef = React.useRef(null);

      React.useEffect(() => api.subscribe(() => setItems(api.decorations)), []);

      /**
       * 打开文件选择框，并记下目标槽位。
       *
       * @param {string} slotId 槽位 id。
       * @returns {void}
       */
      function handlePick(slotId) {
        pendingSlotRef.current = slotId;
        const input = inputRef.current;
        if (input && typeof input.click === 'function') input.click();
      }

      /**
       * 处理选中的装饰图（保留原始画布/透明留白，不做裁剪）。
       *
       * @param {import('react').ChangeEvent<HTMLInputElement>} event 文件选择事件。
       * @returns {void}
       */
      function handleFile(event) {
        const target = event.currentTarget;
        const file = target.files && target.files[0];
        const slotId = pendingSlotRef.current;
        if (!file || !slotId) return;
        setErrorState(null);
        setBusySlot(slotId);
        compressImage(file, { trim: false })
          .then((result) => {
            try {
              api.setDecoration(slotId, result.dataUrl, result.width, result.height);
            } catch {
              setErrorState(t('imageTooLarge'));
            }
          })
          .catch(() => setErrorState(t('imageError')))
          .finally(() => {
            setBusySlot(null);
            pendingSlotRef.current = null;
            if (target) target.value = '';
          });
      }

      /**
       * 清除某个槽位的装饰。
       *
       * @param {string} slotId 槽位 id。
       * @returns {void}
       */
      function handleClear(slotId) {
        setErrorState(null);
        api.clearDecoration(slotId);
      }

      const controls = [];
      for (const slot of DECOR_SLOTS) {
        const item = items[slot.id];
        controls.push(
          React.createElement(
            'div',
            { key: slot.id, style: imageStyles.decorGroup },
            item
              ? React.createElement('span', {
                  style: { ...imageStyles.decorThumb, backgroundImage: `url("${item.dataUrl}")` },
                  'aria-hidden': true,
                })
              : null,
            React.createElement(
              'button',
              {
                type: 'button',
                className: 'dsb-image-button',
                style: imageStyles.button,
                onClick: () => handlePick(slot.id),
                disabled: busySlot !== null,
                'aria-label': t(slot.key),
                title: t(slot.key),
              },
              busySlot === slot.id ? t('imageBusy') : t(slot.key),
            ),
            item
              ? React.createElement(
                  'button',
                  {
                    type: 'button',
                    className: 'dsb-image-icon',
                    style: imageStyles.iconButton,
                    onClick: () => handleClear(slot.id),
                    'aria-label': `${t('decorRemove')} ${t(slot.key)}`,
                  },
                  React.createElement(
                    'svg',
                    { width: 14, height: 14, viewBox: '0 0 16 16', 'aria-hidden': true },
                    React.createElement('path', {
                      d: 'M4 4 L12 12 M12 4 L4 12',
                      stroke: 'currentColor',
                      strokeWidth: 1.5,
                      strokeLinecap: 'round',
                    }),
                  ),
                )
              : null,
          ),
        );
      }

      let description = `${t('decorDescription')} ${t('decorHint')}`;
      if (error) description = `${description}（${error}）`;

      return React.createElement(SettingRow, {
        label: t('decorLabel'),
        description,
        control: React.createElement(
          'div',
          { style: imageStyles.control },
          controls,
          React.createElement('input', {
            ref: inputRef,
            type: 'file',
            accept: 'image/*',
            style: imageStyles.hiddenInput,
            onChange: handleFile,
            tabIndex: -1,
            'aria-hidden': true,
          }),
        ),
      });
    }

    return {
      // 设置行需要 slots；文案需要 locale。
      inject: ['slots', 'locale'],
      apply(ctx) {
        // 用 ctx.effect 托管样式、尾巴属性、调试 API，插件卸载时自动清理。
        ctx.effect(() => {
          const imageConfig = readImageConfig();
          imageDataUrl = imageConfig.dataUrl;
          imageForeground = imageConfig.foreground;
          imageTailColor = imageConfig.tailColor;
          backgroundLooksLikeBubble = imageConfig.looksLikeBubble;
          legacyImageReset = imageConfig.legacyReset;
          readDecorations();
          applyImageState();

          // 升级兼容：旧背景没有「整图」标记时异步补测，避免旧完整图继续被拉伸。
          if (imageDataUrl) {
            let hasFlag = false;
            try {
              hasFlag = window.localStorage.getItem(IMAGE_BUBBLE_LIKE_KEY) !== null;
            } catch {
              hasFlag = false;
            }
            if (!hasFlag) {
              const source = imageDataUrl;
              detectBubbleLikeBackground(source)
                .then((looksLikeBubble) => {
                  if (!looksLikeBubble || imageDataUrl !== source) return;
                  backgroundLooksLikeBubble = true;
                  try {
                    window.localStorage.setItem(IMAGE_BUBBLE_LIKE_KEY, 'on');
                  } catch {
                    // 持久化失败不影响本次生效。
                  }
                  applyImageState();
                  notify();
                })
                .catch(() => undefined);
            }
          }

          tailEnabled = TAIL_FEATURE_ENABLED ? readTailEnabled() : false;
          applyTailAttribute(tailEnabled);

          try {
            mount(readActiveId());
          } catch (error) {
            // 挂载失败不应阻断插件加载：记录错误并保持产品默认外观。
            console.error('[dsh-bubble-skins] mount failed', error);
          }

          window.dshBubbleSkins = api;

          return () => {
            unmount();
            listeners.clear();
            if (window.dshBubbleSkins === api) delete window.dshBubbleSkins;
          };
        });

        // 注册设置行文案（中英双语），随插件卸载移除。
        for (const [locale, dict] of Object.entries(LOCALE_DICTS)) {
          ctx.effect(() => ctx.locale.register(LOCALE_NS, locale, dict));
        }

        // 当前版本只注册「气泡样式」行；气泡尾巴 / 背景 / 装饰暂时隐藏（功能保留，M3 再开放）。
        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'bubble-skins',
              order: SETTINGS_SKIN_ORDER,
              locale: LOCALE_NS,
            },
            BubbleStyleRow,
          ),
        );
      },
    };
  },
});

