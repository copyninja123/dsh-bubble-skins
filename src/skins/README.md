# src/skins —— 皮肤定义（预留）

每套皮肤对应一个模块，导出与 `client.js` 中同构的定义对象：

```js
/**
 * 皮肤定义示例。
 * @type {import('../types').BubbleSkin}
 */
export default {
  id: 'qq-blue',
  name: { zh: 'QQ 经典蓝', en: 'QQ Classic Blue' },
  description: { zh: '浅蓝底 + 右侧尾巴。', en: 'Light blue with a right-side tail.' },
  css: '/* 作用域内 CSS */',
};
```

M2 起，这些模块由构建步骤汇总为浏览器闭包工厂；M1 阶段它们只是设计留档。
