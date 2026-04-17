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
    /* 顶部 90px，水平 10px 确保不超出输入框边界，底部跟随输入框高度并留出两行文字距离 */
    padding: 90px 10px calc(var(--input-container-height) + 3.4em) 10px;
    font-size: 17px; /* 与 MessageItem 保持一致，确保 em 计算准确 */
    scroll-behavior: smooth;
    max-width: 800px;
    width: 100%;
}
</style>