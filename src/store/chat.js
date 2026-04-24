import { defineStore } from 'pinia'
import { streamChat, generateTitle } from '../api/stream'
import { createMarkdownStreamParser } from '../utils/markdownStreamParser'
import { modelApi } from '../api/model'
import { ElMessage } from 'element-plus'

export const useChatStore = defineStore('chat', {
  state: () => ({
    chatList: [],
    activeId: localStorage.getItem('sessionId') || null,
    messagesMap: {},
    isStreaming: false,
    sidebarVisible: true,
    isThink: false,
    currentModelId: localStorage.getItem('currentModelId') || '',
    currentModelName: localStorage.getItem('currentModelName') || '',
    isPromptEnabled: localStorage.getItem('isPromptEnabled') === 'true',
    isModelSwitched: localStorage.getItem('isModelSwitched') === 'true',
    abortController: null,
    newSessionId: null,
  }),

  getters: {
    messages(state) {
      return state.messagesMap[state.activeId] || []
    },
  },

  actions: {
    async initModel() {
      try {
        const currentRes = await modelApi.current()
        this.setCurrentModel(currentRes.id, currentRes.name)
      } catch (error) {
        console.error('初始化模型失败:', error)
      }
    },

    // 设置新会话ID
    setNewSessionId(id) {
      this.newSessionId = id
    },

    setPromptEnabled(val) {
      this.isPromptEnabled = val
      localStorage.setItem('isPromptEnabled', val ? 'true' : 'false')
    },

    setModelSwitched(val) {
      this.isModelSwitched = val
      localStorage.setItem('isModelSwitched', val ? 'true' : 'false')
    },

    setCurrentModel(modelId, modelName) {
      this.currentModelId = modelId || ''
      this.currentModelName = modelName || ''
      localStorage.setItem('currentModelId', this.currentModelId)
      localStorage.setItem('currentModelName', this.currentModelName)

      // 如果是 deepseek 模型，自动开启思考模式
      if (this.currentModelName.toLowerCase().includes('deepseek')) {
        this.isThink = true
      }
    },

    async sendStream(text) {
      if (this.isStreaming) return

      const list = this.messagesMap[this.activeId] || []
      this.isStreaming = true
      this.abortController = new AbortController()

      const think = this.isThink
      const prompt = this.isPromptEnabled

      // 检查是否需要生成标题（对于新会话的第一条消息）
      const chat = this.chatList.find(c => c.id === this.activeId)
      const isNewSession = !chat || chat.title === '新对话'
      const shouldGenerateTitle = isNewSession && list.length === 0

      // 如果会话不在列表中（正常情况下应该在），将其添加
      const isInChatList = !!chat
      if (shouldGenerateTitle && !isInChatList) {
        this.chatList.unshift({ id: this.activeId, title: '新对话' })
      }

      // 如果不是新会话，将其移动到列表最上方
      if (!shouldGenerateTitle && isInChatList) {
        const index = this.chatList.findIndex(c => c.id === this.activeId)
        if (index > 0) {
          const item = this.chatList.splice(index, 1)[0]
          this.chatList.unshift(item)
        }
      }

      // 1️⃣ 用户消息
      list.push({
        id: Date.now(),
        role: 'user',
        content: text,
      })

      // 2️⃣ AI 消息（分块结构）
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        blocks: [],
        thinking: '', // 存储思考内容
        streaming: true,
        modelLoading: true, // 默认显示加载提示
      }

      // 重置标志
      if (this.isModelSwitched) {
        this.setModelSwitched(false)
      }

      list.push(aiMsg)
      // 确保获取到的是响应式引用
      const currentMsg = list[list.length - 1]
      currentMsg.streaming = true

      // 3️⃣ 创建解析器
      let pending = false

      const parser = createMarkdownStreamParser(res => {
        if (pending) return

        pending = true

        requestAnimationFrame(() => {
          // 收到第一个回复块后，提示消失
          if (currentMsg.modelLoading) {
            currentMsg.modelLoading = false
          }
          currentMsg.blocks = res.blocks
          currentMsg.thinking = res.thinking
          pending = false
        })
      })

      // 4️⃣ 调用流式接口
      try {
        await streamChat(
          list,
          chunk => {
            parser.parse(chunk)
          },
          think,
          prompt,
          this.abortController.signal,
        )
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Stream aborted')
        } else {
          console.error('Stream error:', error)
        }
      } finally {
        parser.end()
        currentMsg.streaming = false
        currentMsg.modelLoading = false // 确保结束时提示消失
        this.isStreaming = false
        this.abortController = null
      }

      // 5️⃣ 如果是新对话，流式更新标题
      if (shouldGenerateTitle) {
        const currentChat = this.chatList.find(
          chat => chat.id === this.activeId,
        )
        if (currentChat) {
          let firstChunk = true
          await generateTitle(this.activeId, chunk => {
            if (chunk.content) {
              if (firstChunk) {
                currentChat.title = '' // 仅在收到首个有效内容时清空原标题，防止 UI 塌陷
                firstChunk = false
              }
              currentChat.title += chunk.content
            }
          })
        }
      }
    },

    createChat() {
      const id = Date.now()
      this.chatList.unshift({ id, title: '新对话' })
      this.messagesMap[id] = []
      this.activeId = id
    },

    stopStream() {
      if (this.abortController) {
        this.abortController.abort()
        this.isStreaming = false
        this.abortController = null
      }
    },

    setActive(id) {
      this.activeId = id
      localStorage.setItem('sessionId', id)
    },

    setSidebarVisible(visible) {
      this.sidebarVisible = visible
    },

    toggleThink() {
      // 如果当前是 DeepSeek 模型，不允许关闭思考模式
      if (
        this.isThink &&
        (this.currentModelId.toLowerCase().includes('deepseek') ||
          this.currentModelName.toLowerCase().includes('deepseek'))
      ) {
        ElMessage.warning('DeepSeek-R1模型只支持思考模式')
        return
      }
      this.isThink = !this.isThink
    },

    reset() {
      this.chatList = []
      this.activeId = null
      this.messagesMap = {}
      this.isStreaming = false
      this.isThink = false
      if (this.abortController) {
        this.abortController.abort()
      }
      this.abortController = null
      localStorage.removeItem('sessionId')
      localStorage.removeItem('sessionList')
      localStorage.removeItem('isNewSession')
      sessionStorage.removeItem('is_session_active')
    },
  },
})
