<template>
  <div class="app" :class="{ 'sidebar-hidden': !store.sidebarVisible }">
    <div class="top-mask"></div>
    <Sidebar />
    <div class="main" ref="mainRef" @scroll="handleScroll">
      <ChatWindow />
    </div>
    <div class="input-container" ref="inputContainerRef">
      <InputBox />
    </div>
    <div class="footer">
      <span>内容由 AI 生成，请仔细甄别</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { useChatStore } from './store/chat'
import Sidebar from './components/Sidebar.vue'
import ChatWindow from './components/ChatWindow.vue'
import InputBox from './components/InputBox.vue'

const store = useChatStore()
const messages = computed(() => store.messages)
const mainRef = ref()
const inputContainerRef = ref()
const isAtBottom = ref(true)

// 响应式处理侧边栏
const checkWidth = () => {
    if (window.innerWidth < 768) {
        store.setSidebarVisible(false)
    } else {
        store.setSidebarVisible(true)
    }
}

let resizeObserver

onMounted(() => {
    checkWidth()
    window.addEventListener('resize', checkWidth)

    // 监听输入框高度变化
    if (inputContainerRef.value) {
        resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                // 使用 getBoundingClientRect 获取包含 padding 的完整高度
                const rect = entry.target.getBoundingClientRect()
                document.documentElement.style.setProperty('--input-container-height', `${rect.height}px`)
            }
        })
        resizeObserver.observe(inputContainerRef.value)
    }
})

onUnmounted(() => {
    window.removeEventListener('resize', checkWidth)
    if (resizeObserver) {
        resizeObserver.disconnect()
    }
})

// 检测滚动位置
const handleScroll = () => {
    if (!mainRef.value) return
    const { scrollTop, scrollHeight, clientHeight } = mainRef.value
    // 距离底部 50px 以内都视为在底部
    isAtBottom.value = scrollHeight - scrollTop - clientHeight < 50
}

watch(messages, async () => {
    await nextTick()
    if (mainRef.value && isAtBottom.value) {
        mainRef.value.scrollTop = mainRef.value.scrollHeight
    }
}, { deep: true })
</script>

<style>
.app {
  --sidebar-width: 260px;
  display: flex;
  height: 100vh;
  background: #0f172a;
  color: #fff;
  margin: 0;
  padding: 0;
  position: relative;
  transition: all 0.3s ease;
}

.app.sidebar-hidden {
  --sidebar-width: 0px;
}

.top-mask {
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  height: 100px;
  background: linear-gradient(to bottom, #0f172a 60%, transparent 100%);
  z-index: 100; /* 确保在所有内容之上 */
  pointer-events: none;
  transition: all 0.3s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  /* 防止页面滚动 */
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px; /* 统一左右内边距 */
  overflow-y: auto;
  scrollbar-gutter: stable; /* 预留滚动条位置，防止内容中心偏移 */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.3s ease;
  scroll-behavior: smooth;
}

.main:hover {
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

/* Webkit 滚动条 */
.main::-webkit-scrollbar {
  width: 6px;
}

.main::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
}

.main:hover::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.input-container {
  position: fixed;
  bottom: 0;
  left: var(--sidebar-width);
  right: 0;
  display: flex;
  justify-content: center;
  background: transparent;
  padding: 20px;
  padding-right: calc(20px + 6px); /* 20px 基础 padding + 6px 滚动条预留宽度 */
  z-index: 10;
  transition: all 0.3s ease;
}

.footer {
  position: fixed;
  bottom: 0;
  left: var(--sidebar-width);
  right: 0;
  text-align: center;
  padding: 10px 0;
  padding-right: 6px; /* 同步滚动条宽度 */
  background: #0f172a;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  z-index: 5;
  transition: all 0.3s ease;
}


</style>