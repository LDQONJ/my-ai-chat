<template>
  <div class="input-wrap">
    <div class="input-bg">
      <div class="input-inner">
        <textarea
          ref="textareaRef"
          v-model="text"
          placeholder="给 LDQ's AI 发送消息"
          rows="2"
          @focus="focus = true"
          @blur="focus = false"
          @keydown.enter="handleEnter"
        />

        <!-- 深度思考按钮 -->
        <div class="input-footer">
          <button
            class="think-btn"
            :class="{ active: store.isThink }"
            @click="store.toggleThink"
          >
            <div class="think-icon">
              <Icon
                :icon-class="'icon-deepseek'"
                :font-size="13"
              />
            </div>
            <span>深度思考</span>
          </button>
        </div>

        <button
          class="send-btn"
          :class="{
            'stop-btn': store.isStreaming,
            disabled: isInputEmpty && !store.isStreaming,
          }"
          :disabled="isInputEmpty && !store.isStreaming"
          :title="isInputEmpty && !store.isStreaming ? '请输入内容' : ''"
          @click="send"
        >
          <div class="send-icon">
            <!-- 停止图标 -->
            <Icon
              v-if="store.isStreaming"
              :icon-class="'icon-stop'"
              :font-size="14"
            />
            <!-- 发送图标 -->
            <Icon
              v-else
              :icon-class="'icon-up-arrow'"
              :font-size="17"
            />
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useChatStore } from '../store/chat'
import Icon from '@/components/common/Icon.vue'

const text = ref('')
const focus = ref(false)
const store = useChatStore()
const textareaRef = ref()

const isInputEmpty = computed(() => !text.value.trim())

const send = async () => {
  if (store.isStreaming) {
    store.stopStream()
    return
  }

  if (isInputEmpty.value) {
    return
  }

  const originalText = text.value
  text.value = ''
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }

  try {
    await store.sendStream(originalText)
  } catch (error) {
    text.value = originalText
    nextTick(() => {
      autoResize()
    })
  }
}

const handleEnter = event => {
  if (event.ctrlKey) {
    // Ctrl + Enter 换行
    event.preventDefault() // 阻止默认行为（如表单提交）
    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    text.value = value.substring(0, start) + '\n' + value.substring(end)
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 1
      autoResize()
    })
  } else {
    // Enter 发送
    event.preventDefault()
    send()
  }
}

const handleShiftEnter = () => {
  // Shift+Enter 换行现在由浏览器默认行为处理，这里只需要确保高度调整
  nextTick(() => {
    autoResize()
  })
}

const autoResize = () => {
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
</script>

<style scoped>
.input-wrap {
  padding: 14px 0;
  /* 只留上下 padding，左右对齐由父容器控制 */
  background: transparent;
  max-width: 800px;
  width: 100%;
}

/* 输入框背景，防止下面两个角盖不住消息 */
.input-bg {
  display: flex;
  flex-direction: column;
  /* 改为纵向布局以容纳 footer */
  align-items: flex-start;
  background: var(--bg-main);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  transition: all 0.3s ease;
  max-width: 800px;
  position: relative;
  /* 为按钮定位提供参考 */
}

.input-inner {
  display: flex;
  flex-direction: column;
  /* 改为纵向布局以容纳 footer */
  background: var(--bg-card);
  border-radius: 16px;
  padding: 4px;
  border: 1px solid var(--border);
  transition: all 0.3s ease;
  width: 100%;
  height: 100%;
  position: relative;
  /* 为按钮定位提供参考 */
}

.input-inner:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.input-footer {
  width: 100%;
  padding: 4px 8px;
  display: flex;
  justify-content: flex-start;
}

.think-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-sub);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.think-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.think-btn.active {
  background: rgba(37, 99, 235, 0.1);
  border-color: var(--primary);
  color: var(--primary);
}

.think-icon {
  display: flex;
  align-items: center;
}

textarea {
  width: 100%;
  /* 宽度占满 */
  background: transparent;
  border: none;
  color: var(--text-main);
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
  padding: 8px;
  hyphenate-limit-chars: 0 0 0;
  hyphens: auto;
  overflow-wrap: break-word;
  text-align: justify;
  text-justify: inter-ideograph;
  text-align-last: left;
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
  position: absolute;
  /* 绝对定位 */
  right: 10px;
  /* 距离右侧10px */
  bottom: 10px;
  /* 距离底部10px */
  flex-shrink: 0;
}

.send-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:active {
  transform: scale(0.9);
}

.send-btn.disabled {
  background: rgba(37, 99, 235, 0.4);
  /* 变浅的背景色 */
  /* cursor: not-allowed; */
  transform: none;
}

.stop-btn {
  background: #ef4444;
  /* 红色停止按钮 */
}
</style>
