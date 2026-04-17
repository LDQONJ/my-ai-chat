import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // 全局变量，未声明不会报错，但是会提示未使用
      globals: {
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Proxy: 'readonly',
        Reflect: 'readonly',
        Symbol: 'readonly',
        JSON: 'readonly',
        Math: 'readonly',
        Date: 'readonly',
        RegExp: 'readonly',
        Error: 'readonly',
        Array: 'readonly',
        Object: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Boolean: 'readonly',
        parseInt: 'readonly',
        parseFloat: 'readonly',
        isNaN: 'readonly',
        isFinite: 'readonly',
        encodeURI: 'readonly',
        encodeURIComponent: 'readonly',
        decodeURI: 'readonly',
        decodeURIComponent: 'readonly',
        escape: 'readonly',
        unescape: 'readonly',
        eval: 'readonly',
        undefined: 'readonly',
        ResizeObserver: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // 检查未使用的变量，忽略以 _ 开头的变量
      'prefer-const': 'error', // 建议使用 const 而不是 var
      'no-var': 'error', // 不建议使用 var 语句
      'object-shorthand': 'error', // 建议使用对象字面量
      'vue/multi-word-component-names': 'off', // 关闭多词组件名检查，允许单词组件名
      'vue/no-v-html': 'warn', // 对 v-html 指令发出警告，防止 XSS 风险
      'vue/require-default-prop': 'off', // 关闭 props 默认值检查
      'vue/require-prop-types': 'off', // 关闭 props 类型检查
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js'], // 忽略 dist 目录、node_modules 目录和所有 config.js 文件
  },
]
