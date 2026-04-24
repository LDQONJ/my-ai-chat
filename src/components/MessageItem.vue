<template>
  <div :class="['msg', message.role]">
    <template v-if="message.role === 'assistant'">
      <div class="bubble assistant">
        <!-- 模型加载提示 -->
        <div
          v-if="message.modelLoading"
          class="model-loading-hint"
        >
          <div class="loading-spinner" />
          <span>模型加载中，请稍后...</span>
        </div>

        <!-- 思考部分 -->
        <div
          v-if="message.thinking"
          class="thinking-box"
        >
          <div
            class="thinking-header"
            @click="showThinking = !showThinking"
          >
            <div class="thinking-title">
              <div :class="['icon', { rotate: !showThinking }]">
                <Icon
                  :icon-class="'icon-Down'"
                  :font-size="13"
                />
              </div>

              <span>{{ isThinking ? '正在思考...' : '已完成思考' }}</span>
            </div>
          </div>
          <div
            v-show="showThinking"
            lang="en"
            class="thinking-content markdown"
            @click="handleMarkdownClick"
            v-html="renderMarkdown(message.thinking)"
          />
        </div>

        <template
          v-for="(block, i) in message.blocks"
          :key="i"
        >
          <!-- 文本 -->
          <div
            v-if="block.type === 'text'"
            lang="en"
            class="markdown"
            @click="handleMarkdownClick"
            v-html="
              renderMarkdown(block.content, i === message.blocks.length - 1)
            "
          />

          <!-- 代码块 -->
          <div
            v-else
            class="code-wrapper"
          >
            <div class="code-header">
              <span>{{ block.lang || 'code' }}</span>
              <button
                class="copy-btn"
                @click="copy(block.content, $event)"
              >
                复制
              </button>
            </div>

            <pre
              class="code-block"
            ><code ref="setCodeRef">{{ block.content }}<span
              v-if="i === message.blocks.length - 1 && isStreaming"
              class="cursor"
            /></code></pre>
          </div>
        </template>

        <!-- 原有的光标移除，改为在 Markdown/代码块内部渲染 -->
      </div>
    </template>

    <!-- 用户消息 -->
    <div
      v-else
      class="bubble user"
    >
      {{ formatUserText(message.content) }}
    </div>
  </div>
</template>

<script setup>
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import { nextTick, computed, ref } from 'vue'
import Icon from '@/components/common/Icon.vue'

const props = defineProps({
  message: Object,
})

const showThinking = ref(true)

// 是否正在思考中
const isThinking = computed(() => {
  return props.message.streaming && !props.message.blocks.length
})

const md = new MarkdownIt({
  breaks: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (error) {
        console.log(error)
      }
    }
    return '' // use external default escaping
  },
})

const hasEnglishLetterRe = /[A-Za-z]/
const englishFragmentRe = /[A-Za-z][\x20-\x7E\u00A0\u2018\u2019\u201C\u201D]*/g
const longWordRe = /[A-Za-z][A-Za-z0-9_]{4,}/g
const userLongWordRe = /[A-Za-z][A-Za-z0-9_]{4,}/g

const insertSoftHyphens = text => {
  return text.replace(longWordRe, word => word.split('').join('\u00AD'))
}

const formatUserText = text => {
  const s = String(text ?? '')
  return s.replace(userLongWordRe, word => word.split('').join('\u00AD'))
}

const wrapEnglishWithLang = text => {
  let lastIndex = 0
  let match
  let out = ''
  const escape = md.utils.escapeHtml
  englishFragmentRe.lastIndex = 0

  while ((match = englishFragmentRe.exec(text)) !== null) {
    const start = match.index
    const end = start + match[0].length
    if (start > lastIndex) {
      out += escape(text.slice(lastIndex, start))
    }
    const run = text.slice(start, end)
    const trailingWhitespaceMatch = run.match(/\s+$/)
    const trailingWhitespace = trailingWhitespaceMatch
      ? trailingWhitespaceMatch[0]
      : ''
    const core = trailingWhitespace
      ? run.slice(0, -trailingWhitespace.length)
      : run
    if (core) {
      out += `<span lang="en">${escape(insertSoftHyphens(core))}</span>`
    }
    if (trailingWhitespace) {
      out += escape(trailingWhitespace)
    }
    lastIndex = end
  }

  if (!out) {
    return escape(text)
  }
  if (lastIndex < text.length) {
    out += escape(text.slice(lastIndex))
  }
  return out
}

md.renderer.rules.text = (tokens, idx) => {
  return wrapEnglishWithLang(tokens[idx].content)
}

const defaultCodeInline = md.renderer.rules.code_inline
md.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  if (token?.content && hasEnglishLetterRe.test(token.content)) {
    token.attrSet('lang', 'en')
    token.content = insertSoftHyphens(token.content)
  }
  return defaultCodeInline
    ? defaultCodeInline(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options)
}

// 自定义渲染规则，为 markdown 中的代码块添加头部和样式
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const info = token.info ? token.info.trim() : ''
  const langName = info.split(/\s+/g)[0]
  const highlighted =
    options.highlight(token.content, langName) || token.content

  return `
    <div class="markdown-code-wrapper">
      <div class="markdown-code-header">
        <span>${langName || 'code'}</span>
        <button class="markdown-copy-btn" data-content="${encodeURIComponent(token.content)}">复制</button>
      </div>
      <pre class="hljs"><code>${highlighted}</code></pre>
    </div>
  `
}

// Markdown 渲染
function renderMarkdown(text, isLastBlock = false) {
  const normalizedText = (text || '')
    .replace(/\\n/g, '\n')
    .replace(/(^|\n)(\*\*[^*\n]+?\*\*)\n(?!\n)/g, '$1$2\n\n')
    .replace(/(^|\n)(\s*\*\*[^*\n]+?\*\*)\s*([：:])\s*\n(?!\n)/g, '$1$2$3\n\n')

  let html = md.render(normalizedText)

  if (isLastBlock && props.message.streaming) {
    const cursor = '<span class="cursor"></span>'
    const insertBefore =
      html.lastIndexOf('</li>') !== -1
        ? '</li>'
        : html.lastIndexOf('</p>') !== -1
          ? '</p>'
          : html.lastIndexOf('</h6>') !== -1
            ? '</h6>'
            : html.lastIndexOf('</h5>') !== -1
              ? '</h5>'
              : html.lastIndexOf('</h4>') !== -1
                ? '</h4>'
                : html.lastIndexOf('</h3>') !== -1
                  ? '</h3>'
                  : html.lastIndexOf('</h2>') !== -1
                    ? '</h2>'
                    : html.lastIndexOf('</h1>') !== -1
                      ? '</h1>'
                      : html.lastIndexOf('</div>') !== -1
                        ? '</div>'
                        : null

    if (insertBefore) {
      const idx = html.lastIndexOf(insertBefore)
      html = html.slice(0, idx) + cursor + html.slice(idx)
    } else if (html.lastIndexOf('</') !== -1) {
      const idx = html.lastIndexOf('</')
      html = html.slice(0, idx) + cursor + html.slice(idx)
    } else {
      html += cursor
    }
  }

  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['class', 'lang'],
    ADD_TAGS: ['div', 'span', 'pre', 'code'],
  })
}

// 高亮
const setCodeRef = async el => {
  if (!el) return
  await nextTick()
  hljs.highlightElement(el)
}

// 是否流式中
const isStreaming = computed(() => {
  return !!props.message.streaming
})

// 复制
const copy = (text, event) => {
  navigator.clipboard.writeText(text).then(() => {
    // 简单的反馈：改变按钮文字
    const target = event?.target
    if (target && target.tagName === 'BUTTON') {
      const originalText = target.innerText
      target.innerText = '已复制'
      setTimeout(() => {
        target.innerText = originalText
      }, 2000)
    }
  })
}

// 处理 markdown 中复制按钮的点击事件（事件委托）
const handleMarkdownClick = event => {
  const target = event.target
  if (target.classList.contains('markdown-copy-btn')) {
    const content = decodeURIComponent(target.getAttribute('data-content'))
    copy(content, event)
  }
}
</script>

<style scoped>
.msg {
  display: flex;
  margin-bottom: 16px;
}

.msg.user {
  justify-content: flex-end;
  color: var(--text-main-dark);
}

.bubble.user {
  padding: 10px 15px;
  margin-right: 12px;
}

.bubble.assistant {
  padding: 0 15px;
}

.bubble {
  max-width: 70%;
  background: transparent;
  border-radius: 26px;
  font-size: var(--font-size-main);
  line-height: var(--line-height-main);
  hyphenate-limit-chars: 0 0 0;
  hyphens: auto;
  overflow-wrap: break-word;
  text-align: justify;
  text-justify: inter-ideograph;
  text-align-last: left;
}

/* 思考部分样式 */
.thinking-box {
  margin-bottom: 12px;
  border-left: 2px solid var(--bg-active);
  padding-left: 12px;
  background: rgba(255, 255, 255, 0.02);
}

.thinking-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  color: #94a3b8;
  font-size: var(--font-size-thinking);
  padding: 4px 0;
}

.thinking-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.thinking-title .icon {
  transition: transform 0.2s ease;
}

.thinking-title .icon.rotate {
  transform: rotate(-90deg);
}

.thinking-box .thinking-content {
  color: #64748b;
  font-size: var(--font-size-thinking);
  font-style: italic;
  padding: 8px 16px 8px 0px;
  line-height: var(--line-height-thinking);
}

.thinking-content :deep(p) {
  margin: 4px 0;
}

.thinking-content :deep(ul),
.thinking-content :deep(ol) {
  margin: 4px 0;
  padding-left: 0.7em;
}

.thinking-content > :deep(ul),
.thinking-content > :deep(ol) {
  margin-left: 0.5em;
}

.msg.assistant .bubble {
  max-width: 100%;
  width: 100%;
}

.model-loading-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-sub);
  font-size: var(--font-size-thinking);
  padding: 8px 0;
  margin-bottom: 8px;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--text-sub);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 修复：精确控制用户消息的样式 */
.msg.user .bubble {
  background: #2563eb;
  max-width: 70%;
  hyphens: manual;
}

/* markdown */
.markdown {
  font-size: var(--font-size-main);
  line-height: var(--line-height-main);
  word-break: break-word;
  font-family: var(--font-family-text);
}

.markdown :deep(span[lang='en']) {
  hyphens: manual;
  overflow-wrap: normal;
  word-break: normal;
}

.markdown :deep(.cursor) {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: var(--primary);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 1s infinite;
}

.markdown :deep(ul),
.markdown :deep(ol) {
  padding-left: 0.7em;
  margin: 8px 0;
}

.markdown > :deep(ul),
.markdown > :deep(ol) {
  margin-left: 0.9em;
}

.markdown :deep(li) {
  margin-bottom: 4px;
}

.markdown :deep(p) {
  margin: 8px 0;
}

.markdown :deep(p:first-child) {
  margin-top: 0;
}

.markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown :deep(h1),
.markdown :deep(h2),
.markdown :deep(h3),
.markdown :deep(h4),
.markdown :deep(h5),
.markdown :deep(h6) {
  font-size: 1em;
  font-weight: 600;
  margin: 10px 0 6px;
  line-height: var(--line-height-main);
}

.markdown :deep(h1:first-child),
.markdown :deep(h2:first-child),
.markdown :deep(h3:first-child),
.markdown :deep(h4:first-child),
.markdown :deep(h5:first-child),
.markdown :deep(h6:first-child) {
  margin-top: 0;
}

.markdown :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: max-content;
  min-width: 100%;
  table-layout: auto;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: var(--font-size-thinking);
  line-height: 0.9;
}

.markdown :deep(th),
.markdown :deep(td) {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
  white-space: nowrap;
  overflow-wrap: normal;
  word-break: normal;
}

.markdown :deep(th) {
  text-align: left;
  color: var(--text-sub);
  font-weight: 600;
  background: rgba(255, 255, 255, 0.03);
}

.markdown :deep(tr:last-child td) {
  border-bottom: none;
}

/* 统一 Markdown 中的代码块样式 */
.markdown :deep(.markdown-code-wrapper) {
  margin: 10px 0;
  border-radius: 10px;
  overflow: hidden;
  background: var(--code-bg);
  font-family: var(--font-family-mono);
}

.markdown :deep(.markdown-code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-md);
  padding: 6px 10px;
  background: var(--code-header-bg);
  color: var(--text-sub);
}

.markdown :deep(.markdown-copy-btn) {
  background: transparent;
  border: none;
  color: var(--text-sub);
  cursor: pointer;
  font-size: var(--font-size-md);
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.markdown :deep(.markdown-copy-btn:hover) {
  background: var(--bg-hover);
  color: var(--text-main);
}

.markdown :deep(.hljs) {
  background: transparent !important;
  padding: 12px;
  margin: 0;
  overflow-x: auto;
  font-size: var(--font-size-thinking);
  line-height: 1.6;
}

.markdown :deep(code) {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  background: var(--code-inline-bg);
  padding: 2px 4px;
  border-radius: 4px;
}

.markdown :deep(p code),
.markdown :deep(li code) {
  hyphens: manual;
  white-space: normal;
  overflow-wrap: normal;
  word-break: normal;
}

.markdown :deep(.hljs code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: var(--font-size-thinking);
}

/* code */
.code-wrapper {
  margin-top: 10px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--code-bg);
  font-family: var(--font-family-mono);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-md);
  padding: 6px 10px;
  background: var(--code-header-bg);
  color: var(--text-sub);
}

.copy-btn {
  background: transparent;
  border: none;
  color: var(--text-sub);
  cursor: pointer;
  font-size: var(--font-size-md);
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: var(--bg-hover);
  color: var(--text-main);
}

.code-block {
  margin: 0;
  padding: 12px;
  overflow-x: auto;
  font-size: var(--font-size-thinking);
}

/* cursor */
.cursor {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  background: var(--primary);
  margin-left: 2px;
  vertical-align: middle;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}
</style>
