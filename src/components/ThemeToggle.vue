<template>
  <button
    class="theme-toggle"
    :title="theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
    @click="toggleTheme"
  >
    <Icon
      :icon-class="theme === 'dark' ? 'icon-light' : 'icon-dark'"
      :font-size="16"
    />
  </button>
</template>
  
<script setup>
import Icon from '@/components/common/Icon.vue'
import { computed } from 'vue'
import { useThemeStore } from '@/store/theme'

const themeStore = useThemeStore()
const theme = computed(() => themeStore.theme)

const toggleTheme = () => {
  themeStore.toggle()
}
</script>
  
<style scoped>
.theme-toggle {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 15px;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background: transparent;
  color: var(--text-main);
}

</style>
