<template>
  <div :class="['msg', message.role]">
    <template v-if="message.role === 'assistant'">
      <div class="bubble">
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
            class="thinking-content markdown"
            @click="handleMarkdownClick"
            v-html="renderMarkdown(message.thinking)"
          >
          </div>
        </div>

        <template
          v-for="(block, i) in message.blocks"
          :key="i"
        >
          <!-- 文本 -->
          <div
            v-if="block.type === 'text'"
            class="markdown"
            @click="handleMarkdownClick"
            v-html="renderMarkdown(block.content, i === message.blocks.length - 1)"
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

            <pre class="code-block"><code ref="setCodeRef">{{ block.content }}<span v-if="i === message.blocks.length - 1 && isStreaming" class="cursor"></span></code></pre>
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
      {{ message.content }}
    </div>
  </div>
</template>

<script setup>
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
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

// 自定义渲染规则，为 markdown 中的代码块添加头部和样式
const defaultFence = md.renderer.rules.fence
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const info = token.info ? token.info.trim() : ''
  const langName = info.split(/\s+/g)[0]
  const highlighted = options.highlight(token.content, langName) || token.content

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
  let html = md.render(text || '')

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
    ADD_ATTR: ['class'],
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
const handleMarkdownClick = (event) => {
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
}

.bubble {
  max-width: 70%;
  background: #111827;
  padding: 10px 15px 10px 15px;
  border-radius: 26px;
  font-size: var(--font-size-main);
  line-height: var(--line-height-main);
}

/* 思考部分样式 */
.thinking-box {
  margin-bottom: 12px;
  border-left: 2px solid #374151;
  padding-left: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
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
  padding: 8px 0;
  line-height: var(--line-height-thinking);

}

.thinking-content :deep(p) {
  margin: 4px 0;
}

.thinking-content :deep(ul),
.thinking-content :deep(ol) {
  margin: 4px 0;
  padding-left: 20px;
}

/* 修改：让AI消息铺满整个界面 */
.msg.assistant .bubble {
  max-width: 100%;
  width: 100%;
}

/* 修复：精确控制用户消息的样式 */
.msg.user .bubble {
  background: #2563eb;
  max-width: 70%;
}

/* markdown */
.markdown {
  font-size: var(--font-size-main);
  line-height: var(--line-height-main);
  word-break: break-word;
  font-family: var(--font-family-text);
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
  padding-left: 24px;
  margin: 8px 0;
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

/* 统一 Markdown 中的代码块样式 */
.markdown :deep(.markdown-code-wrapper) {
  margin: 10px 0;
  border-radius: 10px;
  overflow: hidden;
  background: #0b1220;
  font-family: var(--font-family-mono);
}

.markdown :deep(.markdown-code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-md);
  padding: 6px 10px;
  background: #020617;
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
}

.markdown :deep(code) {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 4px;
  border-radius: 4px;
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
  background: #0b1220;
  font-family: var(--font-family-mono);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-md);
  padding: 6px 10px;
  background: #020617;
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
