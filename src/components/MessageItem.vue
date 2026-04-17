<template>
    <div :class="['msg', message.role]">

        <template v-if="message.role === 'assistant'">
            <div class="bubble">

                <!-- 思考部分 -->
                <div v-if="message.thinking" class="thinking-box">
                    <div class="thinking-header" @click="showThinking = !showThinking">
                        <div class="thinking-title">
                            <svg :class="{ 'rotate': !showThinking }" width="12" height="12" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                            <span>{{ isThinking ? '正在思考...' : '已完成思考' }}</span>
                        </div>
                    </div>
                    <div v-show="showThinking" class="thinking-content">
                        {{ message.thinking }}
                    </div>
                </div>

                <template v-for="(block, i) in message.blocks" :key="i">

                    <!-- 文本 -->
                    <div v-if="block.type === 'text'" class="markdown" v-html="renderMarkdown(block.content)" />

                    <!-- 代码块 -->
                    <div v-else class="code-wrapper">
                        <div class="code-header">
                            <span>{{ block.lang || 'code' }}</span>
                            <button @click="copy(block.content)">复制</button>
                        </div>

                        <pre class="code-block">
                            <code ref="setCodeRef">{{ block.content }}</code>
                        </pre>
                    </div>
                </template>

                <!-- 光标（流式时） -->
                <span v-if="isStreaming" class="cursor"></span>

            </div>
        </template>

        <!-- 用户消息 -->
        <div v-else class="bubble user">
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

const props = defineProps({
    message: Object
})

const showThinking = ref(true)

// 是否正在思考中
const isThinking = computed(() => {
    return props.message.streaming && !props.message.blocks.length
})

const md = new MarkdownIt({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(str, { language: lang }).value;
            } catch (__) { }
        }
        return ''; // use external default escaping
    }
})

// Markdown 渲染
function renderMarkdown(text) {
    return DOMPurify.sanitize(md.render(text || ''))
}

// 高亮
const setCodeRef = async (el) => {
    if (!el) return
    await nextTick()
    hljs.highlightElement(el)
}

// 是否流式中
const isStreaming = computed(() => {
    return !!props.message.streaming
})

// 复制
const copy = (text) => {
    navigator.clipboard.writeText(text)
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
    font-size: 17px;
    line-height: 1.5;
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
    font-size: 14px;
    padding: 4px 0;
}

.thinking-title {
    display: flex;
    align-items: center;
    gap: 6px;
}

.thinking-title svg {
    transition: transform 0.2s ease;
}

.thinking-title svg.rotate {
    transform: rotate(-90deg);
}

.thinking-content {
    color: #64748b;
    font-size: 14px;
    font-style: italic;
    white-space: pre-wrap;
    padding: 8px 0;
    line-height: 1.6;
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
    line-height: 1.7;
    word-break: break-word;
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

/* code */
.code-wrapper {
    margin-top: 10px;
    border-radius: 10px;
    overflow: hidden;
    background: #0b1220;
}

.code-header {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    padding: 6px 10px;
    background: #020617;
}

.code-block {
    padding: 12px;
    overflow-x: auto;
}

/* cursor */
.cursor {
    display: inline-block;
    width: 2px;
    height: 18px;
    background: var(--primary);
    margin-left: 4px;
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