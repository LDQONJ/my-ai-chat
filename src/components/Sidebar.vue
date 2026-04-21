<template>
  <div class="sidebar" @click.stop>
    <div class="sidebar-header">
      <div class="logo">LDQ's AI</div>
      <button class="collapse-btn" title="收起侧边栏" @click="store.setSidebarVisible(false)">
        <Icon :icon-class="'icon-sidebar'" :font-size="16" />
      </button>
    </div>

    <div class="new-chat" style="justify-content: center" @click="createChat">
      <div class="new-chat-icon">
        <Icon :icon-class="'icon-chat_add'" :font-size="17" />
      </div>
      <span class="new-chat-text">开启新对话</span>
    </div>

    <div class="chat-list">
      <div v-for="chat in chats" :key="chat.id" class="chat-item" :class="{ active: chat.id === activeId }"
        @click="select(chat.id)">
        <div v-if="renamingId === chat.id" class="rename-input-wrapper">
          <input ref="renameInput" v-model="renamingTitle" class="rename-input" @click.stop
            @keyup.enter="handleRename(chat.id)" @blur="cancelRename" />
        </div>
        <template v-else>
          <span class="chat-title">{{ chat.title }}</span>
          <div class="chat-item-actions">
            <button class="item-more-btn" @click.stop="toggleItemMenu(chat.id)">
              <Icon :icon-class="'icon-more'" :font-size="14" />
            </button>

            <!-- 聊天项更多菜单 -->
            <div v-if="itemMenuVisibleId === chat.id" class="item-more-menu" @click.stop>
              <div class="item-menu-item" @click="startRename(chat)">
                <Icon :icon-class="'icon-edit'" :font-size="12" />
                <span>重命名</span>
              </div>
              <div class="item-menu-item delete" @click="handleDelete(chat.id)">
                <Icon :icon-class="'icon-delete'" :font-size="12" />
                <span>删除</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 用户栏 -->
    <div class="user-section">
      <div class="user-info" @click="handleUserClick">
        <div class="user-avatar">
          <img :src="userStore.isLoggedIn ? fullAvatarUrl : userStore.defaultAvatar
            " alt="用户头像" />
        </div>
        <div v-if="userStore.isLoggedIn" class="user-detail">
          <div class="username">
            {{ userStore.username }}
          </div>
          <div class="email">
            {{ userStore.email }}
          </div>
        </div>
        <div v-else class="user-detail">
          <div class="login-tip">点击登录/注册</div>
        </div>
      </div>

      <!-- 更多按钮 -->
      <div v-if="userStore.isLoggedIn" class="more-options">
        <button class="more-btn" @click.stop="showMoreMenu = !showMoreMenu">
          <Icon :icon-class="'icon-more'" :font-size="16" />
        </button>

        <!-- 弹出菜单 -->
        <div v-if="showMoreMenu" class="more-menu" @click.stop>
          <div class="menu-item logout" @click="handleLogout">
            <Icon :icon-logout="'icon-logout'" :font-size="14" />

            <span>退出登录</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 登录对话框 -->
    <LoginDialog v-model:visible="showLoginDialog" @success="handleLoginSuccess" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

import { useChatStore } from '@/store/chat'
import { useUserStore } from '@/store/user'
import { sessionApi } from '@/api/test'
import Icon from '@/components/common/Icon.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import { ElMessage } from 'element-plus'

const store = useChatStore()
const userStore = useUserStore()

const chats = computed(() => store.chatList)
const activeId = computed(() => store.activeId)
const showLoginDialog = ref(false)
const showMoreMenu = ref(false)
const itemMenuVisibleId = ref(null)
const renamingId = ref(null)
const renamingTitle = ref('')
const renameInput = ref(null)

const fullAvatarUrl = computed(() => {
  if (!userStore.avatar) return userStore.defaultAvatar
  if (
    userStore.avatar.startsWith('http') ||
    userStore.avatar.startsWith('data:')
  )
    return userStore.avatar
  const host = import.meta.env.VITE_API_HOST
  return `${host}${userStore.avatar}`
})

// 获取会话列表
const fetchSessionList = async () => {
  try {
    const sessionList = await sessionApi.list()
    if (sessionList && Array.isArray(sessionList)) {
      // 将session列表转换为chatList格式
      const chatList = sessionList
        .filter(session => session.title && session.title !== '新对话')
        .map(session => ({
          id: session.id,
          title: session.title || '新对话',
          lastMessage: session.lastMessage || '',
        }))

      // 更新store中的chatList
      store.chatList = chatList

      // 保存到本地存储
      localStorage.setItem('sessionList', JSON.stringify(sessionList))

      // 如果有会话且没有设置过活跃会话，设置第一个为活跃会话
      // 如果已经有活跃会话（刷新页面），加载该会话的消息
      if (store.activeId) {
        select(store.activeId, true)
      } else if (chatList.length > 0) {
        select(chatList[0].id, true)
      }
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
  }
}

// 页面加载时获取会话列表
onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchSessionList()
  }
})

const handleUserClick = () => {
  if (!userStore.isLoggedIn) {
    showLoginDialog.value = true
  }
}

const select = async (id, isAuto = false) => {
  try {
    // 调用接口获取会话详情
    const sessionDetail = await sessionApi.queryById(id)

    if (sessionDetail && sessionDetail.messages) {
      // 将sessionVO中的messages转换为store中的格式
      const formattedMessages = sessionDetail.messages.map(msg => ({
        id: Date.now() + Math.random(), // 生成唯一ID
        role: msg.role,
        thinking: msg.thinking || '',
        content: msg.content || '',
        blocks: msg.content ? [{ type: 'text', content: msg.content }] : [],
      }))

      // 更新store中的消息
      store.messagesMap[id] = formattedMessages
      store.setActive(id)
    } else {
      // 如果没有消息数据，设置空消息列表
      store.messagesMap[id] = []
      store.setActive(id)
    }
    localStorage.setItem('sessionId', id)
    // 选择已有会话时清除新会话标志
    // 如果是自动选择（如刷新页面），不清除标志，保留新会话生成标题的能力
    if (!isAuto) {
      localStorage.removeItem('isNewSession')
    }

    // 如果是窄屏模式，选择聊天后自动收起
    if (window.innerWidth < 768 && !isAuto) {
      store.setSidebarVisible(false)
    }
  } catch (error) {
    console.error('获取会话详情失败:', error)
    // 核心修复：如果查询失败（例如会话已被后端清理），重新创建新会话
    if (isAuto) {
      console.log('自动恢复失败，尝试创建新会话...')
      createChat()
    } else {
      // 用户点击导致的失败，尝试从列表中移除该项（可选，目前至少保证不崩溃）
      store.setActive(id)
    }

    // 如果是窄屏模式，选择聊天后自动收起
    if (window.innerWidth < 768 && !isAuto) {
      store.setSidebarVisible(false)
    }
  }
}
const createChat = async () => {
  try {
    // 调用session/create接口创建新会话
    const newSessionId = await sessionApi.create()

    if (newSessionId) {
      // 设置空消息列表
      store.messagesMap[newSessionId] = []

      // 设置为活跃会话
      store.setActive(newSessionId)

      // 保存sessionId到本地存储
      localStorage.setItem('sessionId', newSessionId)

      // 设置标志位，表示这是新创建的会话，尚未发送消息
      localStorage.setItem('isNewSession', 'true')
      // 标志当前会话已激活，防止刷新后再次自动创建
      sessionStorage.setItem('is_session_active', 'true')
    } else {
      // 如果接口调用失败，使用原来的createChat逻辑
      store.createChat()
      localStorage.setItem('isNewSession', 'true')
    }
  } catch (error) {
    console.error('创建新会话失败:', error)
    // 出错时使用原来的createChat逻辑
    store.createChat()
    localStorage.setItem('isNewSession', 'true')
  }

  // 如果是窄屏模式，创建聊天后自动收起侧边栏
  if (window.innerWidth < 768) {
    store.setSidebarVisible(false)
  }
}

const handleLoginSuccess = () => {
  // 登录成功后刷新用户信息
  // userStore会自动从localStorage读取最新的用户信息
  // 这里可以触发一些额外的数据刷新逻辑
  fetchSessionList()
  console.log('登录成功，用户信息已更新')
}

const handleLogout = () => {
  userStore.logout()
  store.reset()
  showMoreMenu.value = false
  // 退出登录后刷新页面或跳转
  window.location.reload()
}

const toggleItemMenu = (id) => {
  if (itemMenuVisibleId.value === id) {
    itemMenuVisibleId.value = null
  } else {
    itemMenuVisibleId.value = id
  }
}

const startRename = async (chat) => {
  renamingId.value = chat.id
  renamingTitle.value = chat.title
  itemMenuVisibleId.value = null
  await nextTick()
  if (renameInput.value && renameInput.value[0]) {
    renameInput.value[0].focus()
  }
}

const handleRename = async (id) => {
  if (!renamingTitle.value.trim()) {
    ElMessage.warning('标题不能为空')
    return
  }

  try {
    await sessionApi.rename(id, renamingTitle.value.trim())
    const chat = store.chatList.find(c => c.id === id)
    if (chat) {
      chat.title = renamingTitle.value.trim()
    }
    ElMessage.success('重命名成功')
    renamingId.value = null
  } catch (error) {
    ElMessage.error('重命名失败')
    console.error(error)
  }
}

const cancelRename = () => {
  renamingId.value = null
}

const handleDelete = async (id) => {
  try {
    await sessionApi.delete(id)
    const index = store.chatList.findIndex(c => c.id === id)
    if (index !== -1) {
      store.chatList.splice(index, 1)
    }
    if (store.activeId === id) {
      if (store.chatList.length > 0) {
        select(store.chatList[0].id)
      } else {
        createChat()
      }
    }
    ElMessage.success('删除成功')
    itemMenuVisibleId.value = null
  } catch (error) {
    ElMessage.error('删除失败')
    console.error(error)
  }
}

// 点击外部关闭更多菜单
onMounted(() => {
  window.addEventListener('click', () => {
    showMoreMenu.value = false
    itemMenuVisibleId.value = null
  })
})
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  padding: 16px 16px 0 16px;
  border-right: 1px solid var(--border);
  transition: width 0.3s ease, padding 0.3s ease, transform 0.3s ease;
  overflow: hidden;
  flex-shrink: 0;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
}

.sidebar-hidden .sidebar {
  padding: 16px 0;
  border-right: none;
}

.logo {
  font-size: 20px;
  margin: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.collapse-btn {
  background: transparent;
  border: none;
  color: var(--text-sub);
  cursor: pointer;
  padding: 4px;
  width: 35px;
  height: 35px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background: var(--bg-hover);
  color: var(--text-main);
}

.new-chat {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-hover);
  /* 添加长方形背景 */
  border-radius: 25px;
  /* 左右两边半圆效果 */
  transition: all 0.3s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.new-chat:hover {
  background: var(--bg-active);
  /* 悬停时背景色变化 */
  transform: scale(1.02);
}

.new-chat-icon {
  font-size: var(--font-size-main);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-chat-text {
  font-size: var(--font-size-main);
  height: 16px;
  line-height: 16px;
  display: flex;
  align-items: center;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chat-list::-webkit-scrollbar {
  display: none;
}

.chat-item {
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  margin-bottom: 2px;
  font-size: var(--font-size-main);
}

.chat-item:hover {
  background: var(--bg-active);
}

.chat-item.active {
  background: var(--bg-hover);
}

.chat-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-item-actions {
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-item:hover .chat-item-actions {
  opacity: 1;
}

.item-more-btn {
  background: none;
  border: none;
  color: var(--text-sub);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-more-btn:hover {
  background: var(--bg-hover);
  color: var(--text-main);
}

.item-more-menu {
  position: absolute;
  top: 100%;
  right: 10px;
  background: var(--bg-sidebar);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  min-width: 100px;
  z-index: 100;
}

.item-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--font-size-md);
  color: var(--text-main);
}

.item-menu-item:hover {
  background: var(--bg-hover);
}

.item-menu-item.delete {
  color: #ff4d4f;
}

.rename-input-wrapper {
  width: 100%;
}

.rename-input {
  width: 100%;
  background: var(--bg-active);
  border: 1px solid var(--primary);
  border-radius: 4px;
  color: var(--text-main);
  padding: 2px 6px;
  outline: none;
  font-size: inherit;
}

.user-section {
  padding: 12px;
  border-top: 1px solid var(--border);
  margin: 0 -16px;
  padding-left: 16px;
  padding-right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
  flex-shrink: 0;
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
  overflow: hidden;
}

.user-section:hover {
  background: var(--bg-hover);
}

.more-options {
  position: relative;
}

.more-btn {
  background: none;
  border: none;
  color: var(--text-sub);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.more-btn:hover {
  background: var(--bg-active);
  color: var(--text-main);
}

.more-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background: var(--bg-sidebar);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  min-width: 120px;
  z-index: 100;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--font-size-thinking);
  color: var(--text-main);
  transition: background 0.2s;
}

.menu-item:hover {
  background: var(--bg-hover);
}

.menu-item.logout {
  color: #ff4d4f;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-active);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-sub);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-detail {
  overflow: hidden;
}

.username {
  font-size: var(--font-size-main);
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email {
  font-size: var(--font-size-thinking);
  color: var(--text-sub);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.login-tip {
  font-size: var(--font-size-thinking);
  color: var(--text-sub);
}
</style>
