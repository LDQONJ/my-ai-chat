import { defineStore } from "pinia";
import { streamChat, generateTitle } from "../api/stream";
import { createMarkdownStreamParser } from "../utils/markdownStreamParser";

export const useChatStore = defineStore("chat", {
  state: () => ({
    chatList: [],
    activeId: localStorage.getItem('sessionId') || null,
    messagesMap: {},
    isStreaming: false,
    sidebarVisible: true,
    isThink: false,
    abortController: null,
  }),

  getters: {
    messages(state) {
      return state.messagesMap[state.activeId] || [];
    },
  },

  actions: {
    async sendStream(text) {
      if (this.isStreaming) return;

      const list = this.messagesMap[this.activeId] || [];
      this.isStreaming = true;
      this.abortController = new AbortController();

      const think = this.isThink;

      // 检查是否是第一次发送消息的新会话
      // 满足以下任一条件即视为新会话：
      // 1. localStorage 中有 isNewSession 标志且消息列表为空
      // 2. 当前活跃会话 ID 不在 chatList 中且消息列表为空
      const isNewSessionFlag = localStorage.getItem('isNewSession') === 'true';
      const isInChatList = this.chatList.some(chat => chat.id === this.activeId);
      const shouldGenerateTitle = (isNewSessionFlag || !isInChatList) && list.length === 0;
      
      // 如果是新会话且这是第一条消息，添加到侧边栏
      if (shouldGenerateTitle) {
        // 添加到聊天列表
        if (!isInChatList) {
          this.chatList.unshift({ id: this.activeId, title: "新对话" });
        }
        // 清除新会话标志
        localStorage.removeItem('isNewSession');
      } else {
        // 如果是旧对话，将其移动到列表最上方
        const index = this.chatList.findIndex(chat => chat.id === this.activeId);
        if (index > 0) {
          const chat = this.chatList.splice(index, 1)[0];
          this.chatList.unshift(chat);
        }
      }

      // 1️⃣ 用户消息
      list.push({
        id: Date.now(),
        role: "user",
        content: text,
      });

      // 2️⃣ AI 消息（分块结构）
      const aiMsg = {
        id: Date.now() + 1,
        role: "assistant",
        blocks: [],
        thinking: "", // 存储思考内容
        streaming: true,
      };

      list.push(aiMsg);
      // 确保获取到的是响应式引用
      const currentMsg = list[list.length - 1];
      currentMsg.streaming = true;

      // 3️⃣ 创建解析器
      let pending = false;

      const parser = createMarkdownStreamParser((res) => {
        if (pending) return;

        pending = true;
         
        requestAnimationFrame(() => {
          currentMsg.blocks = res.blocks;
          currentMsg.thinking = res.thinking;
          pending = false;
        });
      });

      // 4️⃣ 调用流式接口
      try {
        await streamChat(
          list,
          (chunk) => {
            parser.parse(chunk);
          },
          think,
          this.abortController.signal
        );
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Stream aborted');
        } else {
          console.error('Stream error:', error);
        }
      } finally {
        parser.end();
        currentMsg.streaming = false;
        this.isStreaming = false;
        this.abortController = null;
      }

      // 5️⃣ 如果是新对话，流式更新标题
      if (shouldGenerateTitle) {
        const currentChat = this.chatList.find(chat => chat.id === this.activeId);
        if (currentChat) {
          let firstChunk = true;
          await generateTitle(this.activeId, (chunk) => {
            if (chunk.content) {
              if (firstChunk) {
                currentChat.title = ''; // 仅在收到首个有效内容时清空原标题，防止 UI 塌陷
                firstChunk = false;
              }
              currentChat.title += chunk.content;
            }
          });
        }
      }
    },

    createChat() {
      const id = Date.now();
      this.chatList.unshift({ id, title: "新对话" });
      this.messagesMap[id] = [];
      this.activeId = id;
    },

    stopStream() {
      if (this.abortController) {
        this.abortController.abort();
        this.isStreaming = false;
        this.abortController = null;
      }
    },

    setActive(id) {
      this.activeId = id;
      localStorage.setItem('sessionId', id);
    },

    setSidebarVisible(visible) {
      this.sidebarVisible = visible;
    },

    toggleThink() {
      this.isThink = !this.isThink;
    },

    reset() {
      this.chatList = [];
      this.activeId = null;
      this.messagesMap = {};
      this.isStreaming = false;
      this.isThink = false;
      if (this.abortController) {
        this.abortController.abort();
      }
      this.abortController = null;
      localStorage.removeItem('sessionId');
      localStorage.removeItem('sessionList');
      localStorage.removeItem('isNewSession');
      sessionStorage.removeItem('is_session_active');
    }
  },
});
