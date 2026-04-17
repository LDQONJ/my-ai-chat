<template>
    <div class="chat-window">
        <MessageItem v-for="msg in messages" :key="msg.id" :message="msg" />
    </div>
</template>
  
<script setup>
import { computed } from 'vue'
import { useChatStore } from '../store/chat'
import MessageItem from './MessageItem.vue'

const store = useChatStore()
const messages = computed(() => store.messages)
</script>
  
<style scoped>
.chat-window {
    flex: 1;
    /* 底部边距 = 输入框容器高度 + 20px 固定间隙 */
    padding: 90px 25px calc(var(--input-container-height, 80px)) 25px;
    scroll-behavior: smooth;
    max-width: 800px;
    width: 100%;
}
</style>