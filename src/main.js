import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.css'
import { nextTick } from 'vue'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { useThemeStore } from './store/theme'
import { wsManager } from './utils/websocket'

async function hideSplashAfterFirstPaint() {
  if (!Capacitor.isNativePlatform()) return

  await router.isReady()
  await nextTick()

  await new Promise(resolve => requestAnimationFrame(() => resolve()))
  await new Promise(resolve => requestAnimationFrame(() => resolve()))

  await SplashScreen.hide()
}

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  useThemeStore(pinia).init()

  // 初始化 WebSocket 连接
  wsManager.connect()

  app.mount('#app')
  await hideSplashAfterFirstPaint()
}

bootstrap()

// 禁止双指缩放和双击缩放
document.addEventListener('touchstart', (event) => {
  if (event.touches.length > 1) {
    event.preventDefault()
  }
}, { passive: false })

let lastTouchEnd = 0
document.addEventListener('touchend', (event) => {
  const now = new Date().getTime()
  if (now - lastTouchEnd <= 300) {
    event.preventDefault()
  }
  lastTouchEnd = now
}, false)

document.addEventListener('gesturestart', (event) => {
  event.preventDefault()
})
