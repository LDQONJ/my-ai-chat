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
          <Icon :icon-class="'icon-user'" :font-size="20" />
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
    <LoginDialog v-model:visible="showLoginDialog" />
  </div>
</template>
  
<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '@/store/chat'
import { useUserStore } from '@/store/user'
import Icon from '@/components/common/Icon.vue'
import LoginDialog from '@/components/LoginDialog.vue'

const store = useChatStore()
const userStore = useUserStore()

const chats = computed(() => store.chatList)
const activeId = computed(() => store.activeId)
const showLoginDialog = ref(false)

const handleUserClick = () => {
  if (!userStore.isLoggedIn) {
    showLoginDialog.value = true
  }
}

const select = (id) => {
    store.setActive(id)
    // 如果是窄屏模式，选择聊天后自动收起
    if (window.innerWidth < 768) {
        store.setSidebarVisible(false)
    }
}
const createChat = () => {
    store.createChat()
    if (window.innerWidth < 768) {
        store.setSidebarVisible(false)
    }
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
}

.chat-item {
    padding: 10px;
    border-radius: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
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