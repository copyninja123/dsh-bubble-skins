/**
 * 气泡样式库 —— 客户端 bundle。
 *
 * 加载器闭包工厂格式：`window.__ModuleLoader__.load({ id, factory })`，
 * id 必须等于 npm 包名。factory 返回 cordis 客户端插件的 `{ inject, apply }`。
 *
 * 本文件是 M1 骨架：纯 CSS 注入 + 皮肤切换运行时。
 * 不依赖 React，不修改宿主组件，只做两件事：
 *   1. 覆盖气泡相关的 `--dsw-*` 语义 token（颜色）；
 *   2. 注入作用域 CSS（形状 / 尾巴 / 装饰 / 间距）。
 *
 * 所有样式规则都挂在 `html[data-dsh-bubble-skin="<id>"]` 之下，
 * 卸载时移除 style 标签与属性即可完整还原产品默认外观。
 */
window.__ModuleLoader__.load({
  id: 'dsh-bubble-skins',
  factory() {
    /** 气泡本体选择器：官方全客户端唯一一个以 `_bubble` 结尾的 CSS Modules 类名。 */
    const BUBBLE_SELECTOR = '[class*="_bubble"]';

    /** 根元素上的皮肤标记属性。 */
    const ROOT_ATTR = 'data-dsh-bubble-skin';

    /** 注入的 style 标签 id（用于热更新与卸载）。 */
    const STYLE_ID = 'dsh-bubble-skins:style';

    /** 本地持久化的键名。 */
    const STORAGE_KEY = 'dsh-bubble-skins:active';

    /** 默认皮肤 id。 */
    const DEFAULT_SKIN = 'qq-blue';

    /**
     * 内置皮肤注册表。
     *
     * 每套皮肤只需要声明与默认外观的差异：
     * - `tokens`：气泡相关语义 token 的覆盖值；
     * - `css`：作用域内生效的 CSS（会自动包在根元素属性选择器下）。
     *
     * @typedef {{ id: string, name: { zh: string, en: string }, description: { zh: string, en: string }, css: string }} BubbleSkin
     */
    const SKINS = [
      {
        id: 'qq-blue',
        name: { zh: 'QQ 经典蓝', en: 'QQ Classic Blue' },
        description: {
          zh: '浅蓝底 + 右侧气泡尾巴，最接近 QQ 默认观感。',
          en: 'Light blue bubble with a right-side tail.',
        },
        css: `
${BUBBLE_SELECTOR} {
  position: relative;
  border-radius: 16px 6px 16px 16px;
  background: var(--dsw-specific-bubble);
  color: #0b2b3c;
  box-shadow: 0 1px 2px rgba(18, 122, 175, 0.12);
}
${BUBBLE_SELECTOR}::after {
  content: '';
  position: absolute;
  right: -6px;
  bottom: 4px;
  width: 12px;
  height: 12px;
  background: var(--dsw-specific-bubble);
  clip-path: polygon(0 0, 100% 100%, 0 100%);
  border-radius: 1px;
}
body[data-ds-dark-theme] ${BUBBLE_SELECTOR} {
  color: #e8f4fb;
  box-shadow: none;
}
`,
      },
      {
        id: 'qq-deco',
        name: { zh: 'QQ 装饰气泡', en: 'QQ Decorative' },
        description: {
          zh: '深色渐变底 + 两侧装饰角，对应参考图里的会员气泡观感。',
          en: 'Dark gradient bubble with decorative corner ornaments.',
        },
        css: `
${BUBBLE_SELECTOR} {
  position: relative;
  border-radius: 18px;
  padding: 12px 20px;
  background: linear-gradient(180deg, #2b2f36 0%, #15181d 100%);
  color: #f2f3f5;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}
${BUBBLE_SELECTOR}::before,
${BUBBLE_SELECTOR}::after {
  content: '';
  position: absolute;
  width: 30px;
  height: 30px;
  pointer-events: none;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0 2px, transparent 3px),
    linear-gradient(135deg, transparent 42%, rgba(255, 255, 255, 0.55) 46% 50%, transparent 54%);
  opacity: 0.85;
}
${BUBBLE_SELECTOR}::before {
  left: -14px;
  bottom: -12px;
  transform: rotate(-12deg);
}
${BUBBLE_SELECTOR}::after {
  right: -14px;
  top: -12px;
  transform: rotate(168deg);
}
body[data-ds-dark-theme] ${BUBBLE_SELECTOR} {
  background: linear-gradient(180deg, #23272e 0%, #101318 100%);
}
`,
      },
      {
        id: 'glass',
        name: { zh: '毛玻璃', en: 'Frosted Glass' },
        description: {
          zh: '半透明磨砂底 + 细边框，适合浅色与图片背景主题。',
          en: 'Translucent frosted bubble with a hairline border.',
        },
        css: `
${BUBBLE_SELECTOR} {
  border-radius: 18px;
  padding: 11px 18px;
  background: rgba(255, 255, 255, 0.42);
  color: #1d2733;
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 6px 20px rgba(20, 40, 60, 0.12);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
}
body[data-ds-dark-theme] ${BUBBLE_SELECTOR} {
  background: rgba(28, 34, 44, 0.55);
  color: #e9eef5;
  border-color: rgba(255, 255, 255, 0.16);
}
`,
      },
      {
        id: 'pixel',
        name: { zh: '像素风', en: 'Pixel' },
        description: {
          zh: '直角 + 4px 硬阴影 + 像素边框，复古终端感。',
          en: 'Square corners, hard shadow and a pixel border.',
        },
        css: `
${BUBBLE_SELECTOR} {
  position: relative;
  border-radius: 2px;
  padding: 10px 16px;
  background: #fdf6e3;
  color: #1b1b1b;
  border: 3px solid #1b1b1b;
  box-shadow: 4px 4px 0 #1b1b1b;
  font-family: 'Courier New', 'Consolas', monospace;
  letter-spacing: 0.02em;
}
body[data-ds-dark-theme] ${BUBBLE_SELECTOR} {
  background: #1a1a1a;
  color: #e8e8d0;
  border-color: #e8e8d0;
  box-shadow: 4px 4px 0 #e8e8d0;
}
`,
      },
      {
        id: 'minimal',
        name: { zh: '极简', en: 'Minimal' },
        description: {
          zh: '去掉底色与阴影，只保留文字和细分隔线。',
          en: 'No background or shadow; text with a hairline only.',
        },
        css: `
${BUBBLE_SELECTOR} {
  background: transparent;
  color: var(--dsw-alias-label-primary);
  border-left: 2px solid var(--dsw-alias-border-l2);
  border-radius: 0;
  padding: 2px 12px;
  box-shadow: none;
}
body[data-ds-dark-theme] ${BUBBLE_SELECTOR} {
  color: var(--dsw-alias-label-primary);
}
`,
      },
    ];

    /** 皮肤 id → 定义 的索引。 */
    const SKIN_MAP = new Map(SKINS.map((skin) => [skin.id, skin]));

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
     * 生成某一套皮肤的完整样式表。
     *
     * 作用域统一为 `html[data-dsh-bubble-skin="<id>"]`，
     * 保证多套规则互不干扰，且能把 token 覆盖限制在皮肤激活期间。
     *
     * @param {BubbleSkin} skin 皮肤定义。
     * @returns {string} 可直接写入 style 标签的 CSS 文本。
     */
    function buildCss(skin) {
      return `
html[${ROOT_ATTR}="${skin.id}"] {
  --dsh-bubble-skin-active: "${skin.id}";
}
html[${ROOT_ATTR}="${skin.id}"] ${skin.css}
`;
    }

    /** 当前注入的 style 元素，卸载时用于清理。 */
    let styleElement = null;

    /**
     * 挂载（或热替换）某套皮肤。
     *
     * @param {string} skinId 皮肤 id。
     * @returns {boolean} 是否成功挂载。
     */
    function mount(skinId) {
      const skin = SKIN_MAP.get(skinId);
      if (!skin) return false;

      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = STYLE_ID;
        styleElement.setAttribute('data-dsh-bubble-skins', 'true');
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = buildCss(skin);
      document.documentElement.setAttribute(ROOT_ATTR, skin.id);
      return true;
    }

    /**
     * 卸载皮肤：移除 style 标签与根元素属性，恢复产品默认外观。
     *
     * @returns {void}
     */
    function unmount() {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
      styleElement = null;
      document.documentElement.removeAttribute(ROOT_ATTR);
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

    return {
      // M1 不注册插槽；M1.1 接入设置面板后再声明 slots 依赖。
      inject: [],
      apply(ctx) {
        // 用 ctx.effect 托管样式资源，插件卸载时自动清理。
        ctx.effect(() => {
          const activeId = readActiveId();
          mount(activeId);

          // M1 的临时切换入口：控制台 window.dshBubbleSkins.set('glass')。
          // M1.1 起由设置面板接管，这里保留作为调试能力。
          window.dshBubbleSkins = {
            /** 当前皮肤 id。 */
            get current() {
              return document.documentElement.getAttribute(ROOT_ATTR) || null;
            },
            /** 可用皮肤列表。 */
            list: SKINS.map((skin) => ({ id: skin.id, name: skin.name, description: skin.description })),
            /** 切换皮肤。 */
            set: setSkin,
          };

          return () => {
            unmount();
            if (window.dshBubbleSkins) delete window.dshBubbleSkins;
          };
        });
      },
    };
  },
});
