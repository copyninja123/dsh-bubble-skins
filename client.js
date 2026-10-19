/**
 * 气泡样式库 —— 客户端 bundle。
 *
 * 加载器闭包工厂格式：`window.__ModuleLoader__.load({ id, factory })`，
 * id 必须等于 npm 包名。factory 返回 cordis 客户端插件的 `{ inject, apply }`。
 *
 * 运行时职责：
 *   1. 生成「用户气泡作用域内」的 CSS——**每一条规则**都带皮肤作用域前缀；
 *   2. 注入 / 热替换单个 `<style>`（带 data-plugin 归属，便于宿主清理与防残留）；
 *   3. 在 `<html>` 上标记当前皮肤 + 尾巴开关，并在卸载时完整还原；
 *   4. 在「设置 → 通用」注册「气泡样式」（下拉）与「气泡尾巴」（开关）两行。
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

    /** 皮肤选择的本地持久化键名。 */
    const STORAGE_KEY = 'dsh-bubble-skins:active';

    /** 尾巴开关的本地持久化键名。 */
    const TAIL_STORAGE_KEY = 'dsh-bubble-skins:tail';

    /** 默认皮肤 id。 */
    const DEFAULT_SKIN = 'qq-blue';

    /** 尾巴默认开启（贴近 QQ 默认观感）。 */
    const DEFAULT_TAIL = true;

    /** 控制台调试 API 的版本号（供外部脚本判断兼容性）。 */
    const API_VERSION = '0.4.0';

    /** 设置行使用的 locale 命名空间。 */
    const LOCALE_NS = 'bubbleSkins';

    /** 「气泡样式」行在「通用」分区中的位置：紧跟字号（11）之后。 */
    const SETTINGS_SKIN_ORDER = 11.5;

    /** 「气泡尾巴」行紧跟「气泡样式」行。 */
    const SETTINGS_TAIL_ORDER = 11.6;

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
     * @typedef {{ id: string, name: { zh: string, en: string }, description: { zh: string, en: string }, swatch: string, tailColor: string, tailColorDark?: string, rules: Array<{ sel: string, decl: string }> }} BubbleSkin
     */
    const SKINS = [
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
  font-family: 'Courier New', 'Consolas', monospace;
  letter-spacing: 0.02em;
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

      const tailColorRules = [
        `${scope} ${BUBBLE_TARGET} {\n  --dsb-tail-bg: ${skin.tailColor};\n}`,
        skin.tailColorDark
          ? `${scope} body[data-ds-dark-theme] ${BUBBLE_TARGET} {\n  --dsb-tail-bg: ${skin.tailColorDark};\n}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const tailRule = `${scope}[${TAIL_ATTR}="on"] ${BUBBLE_TARGET}::after {\n  content: '';\n  position: absolute;\n  right: -6px;\n  bottom: 4px;\n  width: 12px;\n  height: 12px;\n  background: var(--dsb-tail-bg);\n  clip-path: polygon(0 0, 100% 100%, 0 100%);\n  border-radius: 1px;\n  pointer-events: none;\n}`;

      // 设置行控件（下拉 / 开关）的交互态：样式对齐宿主官方控件。
      const controlRules = [
        `${scope} .dsb-select-button:hover { background: var(--dsw-alias-interactive-bg-hover); }`,
        `${scope} .dsb-select-button:focus-visible { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 2px; }`,
        `${scope} .dsb-menu-item:hover { background: var(--dsw-alias-interactive-bg-hover); }`,
        `${scope} .dsb-menu-item:focus-visible { background: var(--dsw-alias-interactive-bg-hover); outline: none; }`,
        `${scope} .dsb-switch:focus-visible { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 2px; }`,
        // DSH 全局用 corner-shape: superellipse(1.5) 平滑圆角，开关需显式恢复正圆胶囊。
        `${scope} .dsb-switch, ${scope} .dsb-switch > span { corner-shape: round; }`,
      ].join('\n');

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
      const skin = SKIN_MAP.get(skinId);
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
      if (!SKIN_MAP.has(skinId)) return false;
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
      /** 可用皮肤列表。 */
      list: SKINS.map((skin) => ({ id: skin.id, name: skin.name, description: skin.description })),
      /** 切换皮肤。 */
      set: setSkin,
      /** 切换尾巴。 */
      setTail,
      /** 订阅当前皮肤 / 尾巴变化。 */
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

    return {
      // 设置行需要 slots；文案需要 locale。
      inject: ['slots', 'locale'],
      apply(ctx) {
        // 用 ctx.effect 托管样式、尾巴属性、调试 API，插件卸载时自动清理。
        ctx.effect(() => {
          tailEnabled = readTailEnabled();
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

        // 在「设置 → 通用」插入「气泡样式」「气泡尾巴」两行；slot 晚到时自动等待。
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
        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'bubble-skins-tail',
              order: SETTINGS_TAIL_ORDER,
              locale: LOCALE_NS,
            },
            BubbleTailRow,
          ),
        );
      },
    };
  },
});
