<template>
  <div
    class="sidebar"
    @click.stop
  >
    <div class="sidebar-header">
      <div class="logo">
        LDQ's AI
      </div>
      <button
        class="collapse-btn"
        title="收起侧边栏"
        @click="store.setSidebarVisible(false)"
      >
        <Icon
          :icon-class="'icon-sidebar'"
          :font-size="16"
        />
      </button>
    </div>

    <div
      class="new-chat"
      style="justify-content: center;"
      @click="createChat"
    >
      <div class="new-chat-icon">
        <Icon
          :icon-class="'icon-chat_add'"
          :font-size="17"
        />
      </div>
      <span class="new-chat-text">开启新对话</span>
    </div>

    <div class="chat-list">
      <div
        v-for="chat in chats"
        :key="chat.id"
        class="chat-item"
        :class="{ active: chat.id === activeId }"
        @click="select(chat.id)"
      >
        {{ chat.title }}
      </div>
    </div>

    <!-- 用户栏 -->
    <div class="user-section" @click="handleUserClick">
      <div class="user-info">
        <div class="user-avatar">
          <img v-if="userStore.isLoggedIn" :src="userStore.avatar" alt="用户头像" />
        </div>
        <div class="user-detail" v-if="userStore.isLoggedIn">
          <div class="username">{{ userStore.username }}</div>
          <div class="email">{{ userStore.email }}</div>
        </div>
        <div class="user-detail" v-else>
          <div class="login-tip">点击登录/注册</div>
        </div>
      </div>
    </div>

    <!-- 登录对话框 -->
    <LoginDialog v-model:visible="showLoginDialog" @success="handleLoginSuccess" />

  </div>
</template>
  
<script setup>
import { ref, computed, onMounted } from 'vue'

import { useChatStore } from '@/store/chat'
import { useUserStore } from '@/store/user'
import { sessionApi } from '@/api/test'
import Icon from '@/components/common/Icon.vue'
import LoginDialog from '@/components/LoginDialog.vue'

const store = useChatStore()
const userStore = useUserStore()

const chats = computed(() => store.chatList)
const activeId = computed(() => store.activeId)
const showLoginDialog = ref(false)

// 获取会话列表
const fetchSessionList = async () => {
  try {
    const sessionList = await sessionApi.list()
    if (sessionList && Array.isArray(sessionList)) {
      // 将session列表转换为chatList格式
      const chatList = sessionList
      .filter(session => session.title && session.title !== '新对话' )
      .map(session => ({
        id: session.id,
        title: session.title || '新对话',
        lastMessage: session.lastMessage || ''
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
  fetchSessionList()
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
                blocks: msg.content ? [{ type: 'text', content: msg.content }] : []
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
        // 出错时仍然设置活跃会话
        store.setActive(id)
        
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
</script>
  
<style scoped>
.sidebar {
    width: var(--sidebar-width);
    background: var(--bg-sidebar);
    padding: 16px;
    border-right: 1px solid var(--border);
    transition: all 0.3s ease;
    overflow: hidden;
    flex-shrink: 0;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    height: 100vh;
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
    transition: all 0.2s ease;
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
    background: var(--bg-hover); /* 添加长方形背景 */
    border-radius: 25px; /* 左右两边半圆效果 */
    transition: all 0.2s ease;
    cursor: pointer;
    flex-shrink: 0;
}

.new-chat:hover {
    background: var(--bg-active); /* 悬停时背景色变化 */
    transform: scale(1.02);
}


.new-chat-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.new-chat-text {
    font-size: 16px;
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
    transition: all 0.2s ease;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-item:hover {
    background: var(--bg-active);
    transform: translateX(4px);
}

.chat-item.active {
    background: var(--bg-hover);
}

.user-section {
    padding: 12px;
    border-top: 1px solid var(--border);
    margin: 0 -16px;
    padding-left: 16px;
    padding-right: 16px;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
}

.user-section:hover {
    background: var(--bg-hover);
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
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
    font-size: 14px;
    font-weight: 500;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.email {
    font-size: 12px;
    color: var(--text-sub);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.login-tip {
    font-size: 14px;
    color: var(--text-sub);
}
</style>