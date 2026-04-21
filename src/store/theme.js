import { defineStore } from 'pinia'
import githubLightUrl from 'highlight.js/styles/github.css?url'
import githubDarkUrl from 'highlight.js/styles/github-dark.css?url'

const STORAGE_KEY = 'theme'
const HLJS_LINK_ID = 'hljs-theme'

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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
      this.mode = mode === 'dark' || mode === 'light' || mode === 'system' ? mode : 'system'
      localStorage.setItem(STORAGE_KEY, this.mode)
      this.apply()
    },

    toggle() {
      const next = this.theme === 'dark' ? 'light' : 'dark'
      this.setMode(next)
    },

    apply() {
      const t = this.theme
      document.documentElement.setAttribute('data-theme', t)

      const hljsLink = ensureStylesheetLink(HLJS_LINK_ID)
      hljsLink.href = t === 'dark' ? githubDarkUrl : githubLightUrl

      setMetaThemeColor(t === 'dark' ? '#0f172a' : '#ffffff')
    },
  },
})

