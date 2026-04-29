import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.css'
import { useThemeStore } from './store/theme'
import { wsManager } from './utils/websocket'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
useThemeStore(pinia).init()

// 初始化 WebSocket 连接
wsManager.connect()

app.mount('#app')
