<template>
  <div class="chat-window">
    <MessageItem
      v-for="msg in messages"
      :key="msg.id"
      :message="msg"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/store/chat'
import MessageItem from '@/components/MessageItem.vue'
const store = useChatStore()
const messages = computed(() => store.messages)
</script>

<style scoped>
.chat-window {
  flex: 1;
  padding: 90px 0px
    calc(var(--input-container-height) + var(--footer-height) - 65px) 0px;
  scroll-padding-bottom: calc(
    var(--input-container-height) + var(--footer-height) - 65px
  );
  scroll-behavior: smooth;
  max-width: 800px;
  width: 100%;
}
</style>
