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
          <div class="header-title">
            <h2>对话提示词</h2>
            <span class="header-subtitle">(优先级高于全局提示词)</span>
          </div>
          <div class="header-actions">
            <div
              class="switch-container"
              @click="togglePromptEnabled"
            >
              <div
                class="switch"
                :class="{ active: chatStore.isPromptEnabled }"
              >
                <div class="switch-handle" />
              </div>
              <span class="switch-label">{{
                chatStore.isPromptEnabled ? '提示词已开启' : '提示词已关闭'
              }}</span>
            </div>
            <button
              class="close-btn"
              @click="close"
            >
              ×
            </button>
          </div>
        </div>

        <div class="dialog-body">
          <div class="prompt-card">
            <div class="field">
              <label>角色设定 (Persona)</label>
              <textarea
                v-model="form.persona"
                placeholder="例如：你是一个专业的技术顾问..."
                rows="3"
              ></textarea>
            </div>

            <div class="field">
              <label>回复规则 (Rules)</label>
              <textarea
                v-model="form.rules"
                placeholder="例如：使用简洁的语言回复..."
                rows="5"
              ></textarea>
            </div>

            <div class="field">
              <div class="field-header">
                <label>对话示例 (Examples)</label>
                <button
                  class="add-example-btn"
                  @click="addExample"
                >
                  + 新增示例
                </button>
              </div>
              <div
                v-for="(item, index) in form.example"
                :key="index"
                class="example-item"
              >
                <div class="example-inputs">
                  <div class="input-group">
                    <span class="input-label">用户</span>
                    <textarea
                      v-model="item['用户']"
                      placeholder="用户消息示例..."
                      rows="2"
                    ></textarea>
                  </div>
                  <div class="input-group">
                    <span class="input-label">AI</span>
                    <textarea
                      v-model="item['AI']"
                      placeholder="AI 消息示例..."
                      rows="2"
                    ></textarea>
                  </div>
                </div>
                <button
                  class="remove-example-btn"
                  @click="removeExample(index)"
                >
                  删除
                </button>
              </div>
              <div
                v-if="!form.example?.length"
                class="no-data"
              >
                暂无示例
              </div>
            </div>
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
            :disabled="saving"
            @click="handleSave"
          >
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { promptApi } from '@/api/prompt'
import { useChatStore } from '@/store/chat'
import { ElMessage } from 'element-plus'
import Icon from '@/components/common/Icon.vue'

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

const chatStore = useChatStore()

const form = reactive({
  persona: '',
  rules: '',
  example: [],
})

const saving = ref(false)
const originalForm = ref({
  persona: '',
  rules: '',
  example: [],
})

const togglePromptEnabled = () => {
  chatStore.setPromptEnabled(!chatStore.isPromptEnabled)
}

const fetchPrompt = async () => {
  try {
    const res = await promptApi.getSession(props.sessionId)
    form.persona = res.persona || ''
    form.rules = res.rules || ''
    // 过滤掉可能的空对象，并适配后端新格式 (userMsg/aiMsg -> 用户/AI)
    form.example = (res.example || [])
      .map(item => ({
        用户: item.userMsg || '',
        AI: item.aiMsg || '',
      }))
      .filter(item => item['用户'] || item['AI'])
    originalForm.value = {
      persona: form.persona,
      rules: form.rules,
      example: JSON.parse(JSON.stringify(form.example)),
    }
  } catch (error) {
    console.error('获取对话提示词失败:', error)
    ElMessage.error(error.message || '获取对话提示词失败')
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    // 过滤掉未填写的示例，并适配后端新格式 (用户/AI -> userMsg/aiMsg)
    const cleanedExample = (form.example || [])
      .filter(item => item['用户']?.trim() || item['AI']?.trim())
      .map(item => ({
        userMsg: item['用户'] || '',
        aiMsg: item['AI'] || '',
      }))
    const dataToSave = {
      persona: form.persona,
      rules: form.rules,
      example: cleanedExample,
    }
    await promptApi.setSession(props.sessionId, dataToSave)
    // 更新本地原始数据，展示依旧使用“用户”和“AI”
    const displayExample = (form.example || []).filter(
      item => item['用户']?.trim() || item['AI']?.trim(),
    )
    form.example = displayExample
    originalForm.value = {
      persona: form.persona,
      rules: form.rules,
      example: JSON.parse(JSON.stringify(displayExample)),
    }
    ElMessage.success('保存成功')
    close()
    emit('saved')
  } catch (error) {
    console.error('保存对话提示词失败:', error)
    ElMessage.error(error.message || '保存对话提示词失败')
  } finally {
    saving.value = false
  }
}

const addExample = () => {
  form.example.push({ 用户: '', AI: '' })
}

const removeExample = index => {
  form.example.splice(index, 1)
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
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.header-subtitle {
  font-size: 11px;
  color: var(--text-sub);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.switch-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.switch {
  width: 36px;
  height: 18px;
  background-color: var(--border);
  border-radius: 10px;
  position: relative;
  transition: all 0.3s;
}

.switch.active {
  background-color: var(--primary);
}

.switch-handle {
  width: 14px;
  height: 14px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.switch.active .switch-handle {
  left: 20px;
}

.switch-label {
  font-size: 12px;
  color: var(--text-sub);
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
  max-height: 60vh;
  overflow-y: auto;
}

.prompt-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field textarea {
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
  transition: border-color 0.2s;
}

.field textarea:focus {
  border-color: var(--primary);
}

.add-example-btn {
  font-size: 13px;
  color: var(--primary);
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-example-btn:hover {
  opacity: 0.8;
}

.example-item {
  background: var(--bg-main);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
}

.example-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 11px;
  color: var(--text-sub);
  font-weight: 500;
}

.input-group textarea {
  width: 100%;
  background: var(--bg-card) !important;
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  min-height: 60px !important;
}

.remove-example-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 11px;
  color: #ff4d4f;
  background: none;
  border: 1px solid #ff4d4f;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
}

.remove-example-btn:hover {
  opacity: 1;
  background: #fff1f0;
}

.no-data {
  text-align: center;
  color: var(--text-sub);
  font-size: 13px;
  padding: 20px 0;
  background: var(--bg-main);
  border: 1px dashed var(--border);
  border-radius: 8px;
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
