<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="dialog-overlay"
      @click="close"
    >
      <div
        class="dialog-content"
        @click.stop
      >
        <div class="dialog-header">
          <h2>对话提示词 (优先级高于全局提示词)</h2>
          <button
            class="close-btn"
            @click="close"
          >
            ×
          </button>
        </div>

        <div class="dialog-body">
          <div class="form-item">
            <label>角色设定 (Persona)</label>
            <textarea
              v-model="form.persona"
              placeholder="例如：你是一个专业的技术顾问..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-item">
            <label>回复规则 (Rules)</label>
            <textarea
              v-model="form.rules"
              placeholder="例如：使用简洁的语言回复..."
              rows="5"
            ></textarea>
          </div>
        </div>

        <div class="dialog-footer">
          <button
            class="cancel-btn"
            type="button"
            @click="close"
          >
            取消
          </button>
          <button
            class="save-btn"
            type="button"
            :loading="saving"
            @click="handleSave"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { promptApi } from '@/api/prompt'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  sessionId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:visible'])

const form = reactive({
  persona: '',
  rules: '',
})

const saving = ref(false)
const originalForm = ref({
  persona: '',
  rules: '',
})

const fetchPrompt = async () => {
  try {
    const res = await promptApi.getSession(props.sessionId)
    form.persona = res.persona || ''
    form.rules = res.rules || ''
    originalForm.value = {
      persona: form.persona,
      rules: form.rules,
    }
  } catch (error) {
    console.error('获取对话提示词失败:', error)
    ElMessage.error(error.message || '获取对话提示词失败')
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    await promptApi.setSession(props.sessionId, {
      persona: form.persona,
      rules: form.rules,
    })
    ElMessage.success('保存成功')
    close()
  } catch (error) {
    console.error('保存对话提示词失败:', error)
    ElMessage.error(error.message || '保存对话提示词失败')
  } finally {
    saving.value = false
  }
}

const close = () => {
  emit('update:visible', false)
}

const handleOverlayClick = () => {
  close()
}

watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      fetchPrompt()
    }
  },
)

watch(
  () => props.sessionId,
  newVal => {
    if (newVal && props.visible) {
      fetchPrompt()
    }
  },
)
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-content {
  background-color: var(--bg-card);
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.dialog-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-sub);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-main);
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-item {
  margin-bottom: 20px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-item label {
  display: block;
  font-size: 13px;
  color: var(--text-sub);
  margin-bottom: 8px;
}

.form-item textarea {
  width: 100%;
  background: var(--bg-main);
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
  outline: none;
  box-sizing: border-box;
}

.form-item textarea:focus {
  border-color: var(--primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

.cancel-btn {
  padding: 8px 20px;
  background: none;
  border: 1px solid var(--border);
  color: var(--text-sub);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn:hover {
  background-color: var(--bg-hover);
}

.save-btn {
  padding: 8px 20px;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn:hover {
  opacity: 0.9;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
