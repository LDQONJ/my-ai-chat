<!-- iconfont图标组件 -->
<template>
  <i
    :class="['iconfont', iconClass]"
    :style="iconStyle"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
 // 图标类名
  iconClass: {
    type: String,
    default: ''
  },
  // 图标大小
  fontSize: {
    type: [String, Number],
    default: ''
  }, 
  // 图标颜色
  color: {
    type: String,
    default: ''
  }
})

const iconClass = computed(() => props.iconClass)

const iconStyle = computed(() => {
  const style = {}
  if (props.fontSize) {
    style.fontSize = typeof props.fontSize === 'number' 
      ? `${props.fontSize}px` 
      : props.fontSize
  }
  if (props.color) {
    style.color = props.color
  }
  return style
})
</script>

<style scoped>
.iconfont {
  display: inline-block;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
