<template>
    <div class="sidebar">
        <div class="logo">LDQ's AI</div>

        <div class="new-chat" @click="createChat" style="justify-content: center;">
            <div class="new-chat-icon">
                <svg width="16" height="16" view-box="0 0 16 16" fill="null">
                    <path fill="currentColor"
                        d="M8 0.599609C3.91309 0.599609 0.599609 3.91309 0.599609 8C0.599609 9.13376 0.855461 10.2098 1.3125 11.1719L1.5918 11.7588L2.76562 11.2012L2.48633 10.6143C2.11034 9.82278 1.90039 8.93675 1.90039 8C1.90039 4.63106 4.63106 1.90039 8 1.90039C11.3689 1.90039 14.0996 4.63106 14.0996 8C14.0996 11.3689 11.3689 14.0996 8 14.0996C7.31041 14.0996 6.80528 14.0514 6.35742 13.9277C5.91623 13.8059 5.49768 13.6021 4.99707 13.2529C4.26492 12.7422 3.21611 12.5616 2.35156 13.1074L2.33789 13.1162L2.32422 13.126L1.58789 13.6436L2.01953 14.9297L3.0459 14.207C3.36351 14.0065 3.83838 14.0294 4.25293 14.3184C4.84547 14.7317 5.39743 15.011 6.01172 15.1807C6.61947 15.3485 7.25549 15.4004 8 15.4004C12.0869 15.4004 15.4004 12.0869 15.4004 8C15.4004 3.91309 12.0869 0.599609 8 0.599609ZM7.34473 4.93945V7.34961H4.93945V8.65039H7.34473V11.0605H8.64551V8.65039H11.0605V7.34961H8.64551V4.93945H7.34473Z">
                    </path>
                </svg>
            </div>
            <span class="new-chat-text">开启新对话</span>
        </div>

        <div class="chat-list">
            <div v-for="chat in chats" :key="chat.id" class="chat-item" :class="{ active: chat.id === activeId }"
                @click="select(chat.id)">
                {{ chat.title }}
            </div>
        </div>
    </div>
</template>
  
<script setup>
import { computed } from 'vue'
import { useChatStore } from '../store/chat'
const store = useChatStore()

const chats = computed(() => store.chatList)
const activeId = computed(() => store.activeId)

const select = (id) => store.setActive(id)
const createChat = () => store.createChat()
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
    margin-bottom: 20px;
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