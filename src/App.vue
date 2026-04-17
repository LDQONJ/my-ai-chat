<template>
  <div class="app" :class="{ 'sidebar-hidden': !store.sidebarVisible, 'is-mobile': isMobile }">
    <div class="top-mask"></div>
    <button v-if="!store.sidebarVisible" class="expand-btn" @click="toggleSidebar" title="展开侧边栏">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"
          d="M9.67272 0.522841C10.8339 0.522841 11.76 0.522714 12.4963 0.602493C13.2453 0.683657 13.8789 0.854248 14.4264 1.25197C14.7504 1.48739 15.0355 1.77247 15.2709 2.0965C15.6686 2.64394 15.8392 3.27758 15.9204 4.02655C16.0002 4.7629 16 5.68895 16 6.85014V9.14986C16 10.3111 16.0002 11.2371 15.9204 11.9735C15.8392 12.7224 15.6686 13.3561 15.2709 13.9035C15.0355 14.2275 14.7504 14.5126 14.4264 14.748C13.8789 15.1458 13.2453 15.3163 12.4963 15.3975C11.76 15.4773 10.8339 15.4772 9.67272 15.4772H6.3273C5.16611 15.4772 4.24006 15.4773 3.50371 15.3975C2.75474 15.3163 2.1211 15.1458 1.57366 14.748C1.24963 14.5126 0.964549 14.2275 0.729131 13.9035C0.331407 13.3561 0.160817 12.7224 0.0796529 11.9735C-0.000126137 11.2371 1.25338e-09 10.3111 1.25338e-09 9.14986V6.85014C1.25329e-09 5.68895 -0.000126137 4.7629 0.0796529 4.02655C0.160817 3.27758 0.331407 2.64394 0.729131 2.0965C0.964549 1.77247 1.24963 1.48739 1.57366 1.25197C2.1211 0.854248 2.75474 0.683657 3.50371 0.602493C4.24006 0.522714 5.16611 0.522841 6.3273 0.522841H9.67272ZM5.54303 1.88715V14.1118C5.78636 14.1128 6.04709 14.1169 6.3273 14.1169H9.67272C10.8639 14.1169 11.7032 14.1164 12.3493 14.0465C12.9824 13.9779 13.3497 13.8494 13.6268 13.6482C13.8354 13.4966 14.0195 13.3125 14.1711 13.1039C14.3723 12.8268 14.5007 12.4595 14.5693 11.8264C14.6393 11.1803 14.6398 10.341 14.6398 9.14986V6.85014C14.6398 5.65896 14.6393 4.81967 14.5693 4.1736C14.5007 3.54048 14.3723 3.17318 14.1711 2.89609C14.0195 2.68747 13.8354 2.50337 13.6268 2.35179C13.3497 2.1506 12.9824 2.02212 12.3493 1.95353C11.7032 1.88358 10.8639 1.88307 9.67272 1.88307H6.3273C6.04709 1.88307 5.78636 1.8862 5.54303 1.88715ZM4.1828 1.91166C3.99125 1.9216 3.8148 1.93577 3.65076 1.95353C3.01764 2.02212 2.65034 2.1506 2.37325 2.35179C2.16463 2.50337 1.98052 2.68747 1.82895 2.89609C1.62776 3.17318 1.49928 3.54048 1.43069 4.1736C1.36074 4.81967 1.36023 5.65896 1.36023 6.85014V9.14986C1.36023 10.341 1.36074 11.1803 1.43069 11.8264C1.49928 12.4595 1.62776 12.8268 1.82895 13.1039C1.98052 13.3125 2.16463 13.4966 2.37325 13.6482C2.65034 13.8494 3.01764 13.9779 3.65076 14.0465C3.81478 14.0642 3.99127 14.0774 4.1828 14.0873V1.91166Z" />
      </svg>
    </button>
    <!-- 移动端侧边栏展开时的遮罩 -->
    <div v-if="isMobile && store.sidebarVisible" class="sidebar-overlay" @click="store.setSidebarVisible(false)"></div>
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
const isMobile = ref(false)

// 响应式处理侧边栏
const checkWidth = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    store.setSidebarVisible(false)
  } else {
    store.setSidebarVisible(true)
  }
}

const toggleSidebar = () => {
  store.setSidebarVisible(!store.sidebarVisible)
}

// 监听消息发送，如果是移动端则自动收起侧边栏
watch(() => store.isStreaming, (newVal) => {
  if (newVal && isMobile.value) {
    store.setSidebarVisible(false)
  }
})

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

/* 展开按钮样式 */
.expand-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 101;
  /* 高于 top-mask (100) */
  transition: all 0.2s ease;
}

.expand-btn:hover {
  background: var(--bg-hover);
  color: var(--text-main);
  transform: translateX(2px);
}

/* 移动端侧边栏遮罩 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  /* 移除模糊效果，防止某些环境下导致整个页面变白或变暗过重 */
  z-index: 9998;
  /* 紧贴侧边栏 (9999) 之下 */
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.top-mask {
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  height: 100px;
  background: linear-gradient(to bottom, #0f172a 60%, transparent 100%);
  z-index: 100;
  /* 确保在所有内容之上 */
  pointer-events: none;
  transition: all 0.3s ease;
}

/* 移动端布局适配 */
.is-mobile .sidebar {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  bottom: 0 !important;
  z-index: 9999 !important;
  /* 极高层级，确保在遮罩之上 */
  width: 280px !important;
  transform: translateX(-100%) !important;
  background: #1e293b !important;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.5) !important;
  transition: transform 0.3s ease !important;
}

.is-mobile.sidebar-hidden .sidebar {
  transform: translateX(-100%) !important;
}

.is-mobile:not(.sidebar-hidden) .sidebar {
  transform: translateX(0) !important;
}

.app.is-mobile .top-mask {
  left: 0;
}

.app.is-mobile .input-container,
.app.is-mobile .footer {
  left: 0;
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
  padding: 0 20px;
  /* 统一左右内边距 */
  overflow-y: auto;
  scrollbar-gutter: stable;
  /* 预留滚动条位置，防止内容中心偏移 */
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
  padding-right: calc(20px + 6px);
  /* 20px 基础 padding + 6px 滚动条预留宽度 */
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
  padding-right: 6px;
  /* 同步滚动条宽度 */
  background: #0f172a;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  z-index: 5;
  transition: all 0.3s ease;
}</style>