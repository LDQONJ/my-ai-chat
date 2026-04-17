<template>
    <div class="input-wrap">
        <div class="input-inner">
            <textarea v-model="text" @focus="focus = true" @blur="focus = false" @keyup.enter="send"
                placeholder="给 LDQ's AI 发送消息" rows="3" ref="textareaRef" ></textarea>
            <button 
                @click="send" 
                class="send-btn" 
                :class="{ 'stop-btn': store.isStreaming, 'disabled': isInputEmpty && !store.isStreaming }"
                :disabled="isInputEmpty && !store.isStreaming"
                :title="isInputEmpty && !store.isStreaming ? '请输入内容' : ''"
            >
                <div class="send-icon">
                    <!-- 停止图标 -->
                    <svg v-if="store.isStreaming" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="10" height="10" fill="currentColor" rx="1" />
                    </svg>
                    <!-- 发送图标 -->
                    <svg v-else width="16" height="16" view-box="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="currentColor" d="M8.3125 0.981587C8.66767 1.0545 8.97902 1.20558 9.2627 1.43374C9.48724 1.61438 9.73029 1.85933 9.97949 2.10854L14.707 6.83608L13.293 8.25014L9 3.95717V15.0431H7V3.95717L2.70703 8.25014L1.29297 6.83608L6.02051 2.10854C6.26971 1.85933 6.51277 1.61438 6.7373 1.43374C6.97662 1.24126 7.28445 1.04542 7.6875 0.981587C7.8973 0.94841 8.1031 0.956564 8.3125 0.981587Z">
                        </path>
                    </svg>
                </div>
            </button>
        </div>
    </div>
</template>
  
<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '../store/chat'

const text = ref('')
const focus = ref(false)
const store = useChatStore()
const textareaRef = ref()

const isInputEmpty = computed(() => !text.value.trim())


const send = () => {
    if (store.isStreaming) {
        // 暂时不实现停止功能
        return
    }

    if (isInputEmpty.value) {
        return
    }

    store.sendStream(text.value)
    text.value = ''
    if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
    }
}

const handleShiftEnter = (event) => {
    // Shift+Enter 换行
    const textarea = event.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    text.value = text.value.substring(0, start) + '\n' + text.value.substring(end)
    nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1
        autoResize(textarea)
    })
}

const autoResize = (textarea) => {
    if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
        textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
    }
}

// 监听文本变化自动调整高度
const watchText = () => {
    if (textareaRef.value) {
        autoResize(textareaRef.value)
    }
}

// 使用watch或直接监听input事件
</script>
  
<style scoped>
.input-wrap {
    padding: 14px;
    background: transparent;
    max-width: 800px;
    width: 100%;
}

.input-inner {
    display: flex;
    align-items: flex-start;
    background: var(--bg-card);
    border-radius: 16px;
    padding: 10px;
    border: 1px solid var(--border);
    transition: all 0.2s;
    max-width: 800px;
    position: relative; /* 为按钮定位提供参考 */
}

.input-inner:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

textarea {
    flex: 1;
    background: transparent;
    border: none;
    color: white;
    outline: none;
    resize: none;
    /* 禁用手动调整大小 */
    min-height: 60px;
    /* 最小高度 */
    max-height: 200px;
    /* 最大高度限制 */
    line-height: 1.4;
    font-family: inherit;
    font-size: 16px;
    overflow-y: auto;
    padding-right: 50px;
    padding-left: 7px;
    padding-top: 7px;
    padding-bottom: 7px;

    /* 内容超出时显示滚动条 */
}

.send-btn {
    background: var(--primary);
    border: none;
    color: white;
    border-radius: 25px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    transition: transform 0.1s;
    position: absolute; /* 绝对定位 */
    right: 10px; /* 距离右侧10px */
    bottom: 10px; /* 距离底部10px */
    flex-shrink: 0;
}

.send-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.send-icon svg {
    width: 16px;
    height: 16px;
}

.send-btn:active {
    transform: scale(0.9);
}

.send-btn.disabled {
    background: rgba(37, 99, 235, 0.4); /* 变浅的背景色 */
    /* cursor: not-allowed; */
    transform: none;
}

.stop-btn {
    background: #ef4444; /* 红色停止按钮 */
}
</style>