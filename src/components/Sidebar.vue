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
  </div>
</template>
  
<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/store/chat'
import Icon from '@/components/common/Icon.vue'
const store = useChatStore()

const chats = computed(() => store.chatList)
const activeId = computed(() => store.activeId)

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
</style>