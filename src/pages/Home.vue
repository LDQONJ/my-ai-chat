<!-- 首页 -->

<template>
  <div
    class="app"
    :class="{ 'sidebar-hidden': !store.sidebarVisible, 'is-mobile': isMobile }"
  >
    <div class="top-mask" />
    <button
      v-if="!store.sidebarVisible"
      class="expand-btn"
      title="展开侧边栏"
      @click="toggleSidebar"
    >
      <Icon
        :icon-class="'icon-sidebar'"
        :font-size="16"
      />
    </button>
    <!-- 移动端侧边栏展开时的遮罩 -->
    <div
      v-if="isMobile && store.sidebarVisible"
      class="sidebar-overlay"
      @click="store.setSidebarVisible(false)"
    />
    <Sidebar />
    <div
      ref="mainRef"
      class="main"
      @scroll="handleScroll"
    >
      <ChatWindow />
    </div>
    <div
      ref="inputContainerRef"
      class="input-container"
    >
      <InputBox />
    </div>
    <div class="footer">
      <span>内容由 AI 生成，请仔细甄别</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@/store/chat'
import { useUserStore } from '@/store/user'
import { userApi, sessionApi} from '@/api/test'
import Sidebar from '@/components/Sidebar.vue'
import ChatWindow from '@/components/ChatWindow.vue'
import InputBox from '@/components/InputBox.vue'
import Icon from '@/components/common/Icon.vue'

const store = useChatStore()
const userStore = useUserStore()
const messages = computed(() => store.messages)
const mainRef = ref()
const inputContainerRef = ref()
const isAtBottom = ref(true)
const isMobile = ref(false)

// 页面加载时刷新用户信息
const refreshUserInfo = async () => {
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const userInfo = await userApi.me()
      if (userInfo) {
        userStore.setUserInfo(userInfo)
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      // 如果token无效，清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      userStore.logout()
    }
  }
}
// 创建会话
const createSession = async () => {
  try {
    const sessionId = await sessionApi.create()
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId)
      localStorage.setItem('isNewSession', 'true')
      store.setActive(sessionId)
      store.messagesMap[sessionId] = []
      console.log('会话创建成功，sessionId:', sessionId)
    }
  } catch (error) {
    console.error('创建会话失败:', error)
  }
}

// 响应式处理侧边栏
let lastWidth = window.innerWidth
const checkWidth = () => {
  const currentWidth = window.innerWidth
  const wasMobile = isMobile.value
  isMobile.value = currentWidth < 768

  // 只有当宽度跨越阈值时，才自动调整侧边栏可见性
  if (isMobile.value !== wasMobile) {
    if (isMobile.value) {
      store.setSidebarVisible(false)
    } else {
      store.setSidebarVisible(true)
    }
  }
  lastWidth = currentWidth
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

  refreshUserInfo()
  
  const token = localStorage.getItem('token')
  if (!token) {
    // 未登录用户：每次刷新页面都清空旧会话并创建新会话
    localStorage.removeItem('sessionId')
    localStorage.removeItem('isNewSession')
    store.activeId = null
    createSession()
  } else {
    // 已登录用户：区分刷新和重新打开（sessionStorage 在标签页关闭后会清除）
    if (!sessionStorage.getItem('is_session_active')) {
      createSession()
      sessionStorage.setItem('is_session_active', 'true')
    }
  }

  // 监听输入框高度变化
  if (inputContainerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
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
  height: 100dvh;
  background: #0f172a;
  color: #fff;
  margin: 0;
  padding: 0;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
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
}
</style>