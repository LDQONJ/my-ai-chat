import { defineStore } from 'pinia'
import { streamChat } from '../api/stream'
import { createMarkdownStreamParser } from '../utils/markdownStreamParser'

export const useChatStore = defineStore('chat', {
  state: () => ({
    chatList: [{ id: 1, title: '新对话' }],
    activeId: 1,
    messagesMap: {
      1: []
    },
    isStreaming: false,
    sidebarVisible: true
  }),

  getters: {
    messages(state) {
      return state.messagesMap[state.activeId] || []
    }
  },

  actions: {
    async sendStream(text) {
      if (this.isStreaming) return
      
      const list = this.messagesMap[this.activeId]
      this.isStreaming = true

      // 1️⃣ 用户消息
      list.push({
        id: Date.now(),
        role: 'user',
        content: text
      })

      // 2️⃣ AI 消息（分块结构）
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        blocks: [],
        streaming: true
      }

      list.push(aiMsg)
      // 确保获取到的是响应式引用
      const currentMsg = list[list.length - 1]
      currentMsg.streaming = true 

      // 3️⃣ 创建解析器
      let pending = false

      const parser = createMarkdownStreamParser((blocks) => {
        if (pending) return

        pending = true
        requestAnimationFrame(() => {
          currentMsg.blocks = blocks
          pending = false
        })
      })

      // 4️⃣ 调用流式接口
      await streamChat(list, (chunk) => {
        parser.parse(chunk)
      })

      parser.end()
      currentMsg.blocks = parser.getBlocks()
      currentMsg.streaming = false
      this.isStreaming = false
    },

    createChat() {
      const id = Date.now()
      this.chatList.unshift({ id, title: '新对话' })
      this.messagesMap[id] = []
      this.activeId = id
    },

    setActive(id) {
      this.activeId = id
    },

    setSidebarVisible(visible) {
      this.sidebarVisible = visible
    }
  }
})