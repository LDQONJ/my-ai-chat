import { defineStore } from 'pinia'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'
import githubLightUrl from 'highlight.js/styles/github.css?url'
import githubDarkUrl from 'highlight.js/styles/github-dark.css?url'

const STORAGE_KEY = 'theme'
const HLJS_LINK_ID = 'hljs-theme'

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function ensureStylesheetLink(id) {
  const existing = document.getElementById(id)
  if (existing && existing.tagName === 'LINK') return existing
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  document.head.appendChild(link)
  return link
}

function setMetaThemeColor(color) {
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', color)
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: 'system',
    systemTheme: 'dark',
  }),
  getters: {
    theme(state) {
      return state.mode === 'system' ? state.systemTheme : state.mode
    },
  },
  actions: {
    init() {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        this.mode = saved
      } else {
        this.mode = 'system'
      }

      this.systemTheme = getSystemTheme()
      
      // 初始化状态栏为沉浸式（仅在原生平台）
      if (Capacitor.isNativePlatform()) {
        StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {})
        // 确保 Android 状态栏背景彻底透明，不带任何系统遮罩
        StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {})
      }

      this.apply()

      const media = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => {
        this.systemTheme = getSystemTheme()
        if (this.mode === 'system') {
          this.apply()
        }
      }
      if (media.addEventListener) {
        media.addEventListener('change', onChange)
      } else if (media.addListener) {
        media.addListener(onChange)
      }
    },

    setMode(mode) {
      this.mode =
        mode === 'dark' || mode === 'light' || mode === 'system'
          ? mode
          : 'system'
      localStorage.setItem(STORAGE_KEY, this.mode)
      this.apply()
    },

    toggle(event, buttonEl) {
      const isAppearanceTransition =
        document.startViewTransition &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (!isAppearanceTransition || !event) {
        const next = this.theme === 'dark' ? 'light' : 'dark'
        this.setMode(next)
        return
      }

      // 优先从传入的按钮引用获取位置，否则从 event 获取，确保移动端坐标精准
      const targetEl = buttonEl || event.currentTarget
      const rect = targetEl.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

      const endRadius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
      )

      const transition = document.startViewTransition(() => {
        const next = this.theme === 'dark' ? 'light' : 'dark'
        this.setMode(next)
      })

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius + 100}px at ${x}px ${y}px)`,
        ]
        const isDark = this.theme === 'dark'

        document.documentElement.animate(
          {
            clipPath: isDark ? clipPath : [...clipPath].reverse(),
          },
          {
            duration: 800,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: isDark
              ? '::view-transition-new(root)'
              : '::view-transition-old(root)',
            fill: 'forwards',
          },
        )
      })
    },

    apply() {
      const t = this.theme
      document.documentElement.setAttribute('data-theme', t)

      // 同步 Element Plus 的深色模式
      if (t === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      const hljsLink = ensureStylesheetLink(HLJS_LINK_ID)
      hljsLink.href = t === 'dark' ? githubDarkUrl : githubLightUrl

      setMetaThemeColor(t === 'dark' ? '#0f172a' : '#ffffff')

      // 同步原生状态栏样式
      if (Capacitor.isNativePlatform()) {
        StatusBar.setStyle({
          style: t === 'dark' ? Style.Dark : Style.Light,
        }).catch(() => {})
      }
    },
  },
})
