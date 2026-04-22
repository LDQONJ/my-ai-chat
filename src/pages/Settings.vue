<template>
  <div class="settings-page">
    <div class="settings-header">
      <button
        class="back-btn"
        @click="router.back()"
      >
        <Icon
          icon-class="icon-back"
          :font-size="20"
        />
      </button>
      <h2>设置</h2>
    </div>

    <div class="settings-content">
      <!-- 用户信息 -->
      <section class="settings-section">
        <div class="section-header">
          <h3>用户信息</h3>
          <button
            v-if="!isEditing"
            class="edit-btn"
            @click="startEditing"
          >
            <Icon
              icon-class="icon-edit"
              :font-size="14"
            />
            <span>修改资料</span>
          </button>
          <div
            v-else
            class="edit-actions"
          >
            <button
              class="save-btn"
              :loading="savingUser"
              @click="saveUserInfo"
            >
              保存
            </button>
            <button
              class="cancel-btn"
              @click="cancelEditing"
            >
              取消
            </button>
          </div>
        </div>
        <div class="user-card">
          <div
            class="user-avatar-large"
            :class="{ editing: isEditing }"
            @click="isEditing && triggerAvatarUpload()"
          >
            <img
              :src="displayAvatar"
              alt="用户头像"
            />
            <div
              v-if="isEditing"
              class="avatar-overlay"
            >
              <Icon
                icon-class="icon-camera"
                :font-size="20"
              />
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden-input"
              @change="handleFileUpload"
            />
          </div>
          <div class="user-info-fields">
            <div class="field">
              <label>用户名</label>
              <input
                v-if="isEditing"
                v-model="editForm.username"
                type="text"
              />
              <span v-else>{{ userStore.username }}</span>
            </div>
            <div class="field">
              <label>邮箱</label>
              <input
                v-if="isEditing"
                v-model="editForm.email"
                type="email"
              />
              <span v-else>{{ userStore.email }}</span>
            </div>
            <div class="field">
              <label>手机号</label>
              <input
                v-if="isEditing"
                v-model="editForm.phone"
                type="tel"
              />
              <span v-else>{{ userStore.phone || '未绑定' }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 模型设置 -->
      <section class="settings-section">
        <h3>模型设置</h3>
        <br />
        <div class="model-selection">
          <div
            v-if="loadingModels"
            class="loading"
          >
            加载中...
          </div>
          <div
            v-else
            class="model-list"
          >
            <div
              v-for="model in models"
              :key="model.id"
              class="model-item"
              :class="{ active: currentModelId === model.id }"
              @click="changeModel(model.id)"
            >
              <div class="model-info">
                <span class="model-name">{{ model.name }}</span>
                <span class="model-desc">{{ model.description }}</span>
              </div>
              <div class="model-radio">
                <Icon
                  v-if="currentModelId === model.id"
                  icon-class="icon-success"
                  :font-size="16"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 退出登录 -->
      <section class="settings-section logout-section">
        <button
          class="logout-btn"
          @click="handleLogout"
        >
          <Icon
            icon-class="icon-logout"
            :font-size="16"
          />
          <span>退出登录</span>
        </button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useChatStore } from '@/store/chat'
import { modelApi } from '@/api/model'
import { userApi } from '@/api/user'
import { fileApi } from '@/api/file'
import Icon from '@/components/common/Icon.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const chatStore = useChatStore()

const models = ref([])
const currentModelId = ref('')
const loadingModels = ref(false)
const fileInput = ref(null)

const isEditing = ref(false)
const savingUser = ref(false)
const editForm = reactive({
  username: '',
  email: '',
  phone: '',
  avatar: '',
})

const getFullAvatarUrl = avatar => {
  if (!avatar) return userStore.defaultAvatar
  if (avatar.startsWith('http') || avatar.startsWith('data:')) return avatar
  const host = import.meta.env.VITE_API_HOST
  return `${host}${avatar}`
}

const displayAvatar = computed(() => {
  if (isEditing.value) {
    return getFullAvatarUrl(editForm.avatar)
  }
  return getFullAvatarUrl(userStore.avatar)
})

const startEditing = () => {
  editForm.username = userStore.username
  editForm.email = userStore.email
  editForm.phone = userStore.phone
  editForm.avatar = userStore.avatar
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
}

const saveUserInfo = async () => {
  savingUser.value = true
  try {
    await userApi.update(editForm)
    // 更新 store
    userStore.setUserInfo({
      ...userStore.userInfo,
      ...editForm,
    })
    ElMessage.success('更新成功')
    isEditing.value = false
  } catch (error) {
    console.error('更新用户信息失败:', error)
    ElMessage.error(error.message || '更新失败')
  } finally {
    savingUser.value = false
  }
}

const triggerAvatarUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = async event => {
  const file = event.target.files[0]
  if (!file) return

  // 校验文件类型和大小
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 2MB')
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await fileApi.upload(formData)
    editForm.avatar = res // 假设响应为文件路径字符串
    ElMessage.success('头像上传成功')
  } catch (err) {
    ElMessage.error(err.message || '头像上传失败')
  } finally {
    // 重置 input，允许上传同一张图
    if (event.target) {
      event.target.value = ''
    }
  }
}

const fetchModels = async () => {
  loadingModels.value = true
  try {
    const [listRes, currentRes] = await Promise.all([
      modelApi.list(),
      modelApi.current(),
    ])
    models.value = listRes
    currentModelId.value = currentRes.id
  } catch (error) {
    console.error('获取模型列表失败:', error)
    ElMessage.error('获取模型列表失败')
  } finally {
    loadingModels.value = false
  }
}

const changeModel = async modelId => {
  if (currentModelId.value === modelId) return
  try {
    await modelApi.change(modelId)
    currentModelId.value = modelId
    chatStore.setModelSwitched(true)
    ElMessage.success('模型切换成功')
  } catch (error) {
    console.error('切换模型失败:', error)
    ElMessage.error('切换模型失败')
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      userStore.logout()
      chatStore.reset()
      ElMessage.success('已退出登录')
      router.push('/home')
    })
    .catch(() => {})
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/home')
    return
  }
  fetchModels()
})
</script>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-main);
  color: var(--text-main);
}

.settings-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--border);
  gap: 16px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: var(--bg-hover);
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-sub);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.edit-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-main);
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.save-btn {
  padding: 6px 16px;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  padding: 6px 16px;
  background: none;
  border: 1px solid var(--border);
  color: var(--text-sub);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.user-card {
  display: flex;
  gap: 24px;
  padding: 24px;
  background-color: var(--bg-card);
  border-radius: 12px;
  align-items: center;
}

@media (max-width: 600px) {
  .user-card {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
}

.user-avatar-large {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--border);
  position: relative;
  cursor: default;
}

.user-avatar-large.editing {
  cursor: pointer;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hidden-input {
  display: none;
}

.user-info-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 12px;
  color: var(--text-sub);
}

.field span {
  font-size: 15px;
  color: var(--text-main);
}

.field input {
  background: var(--bg-main);
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.field input:focus {
  border-color: var(--primary);
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: var(--bg-card);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.model-item:hover {
  background-color: var(--bg-hover);
}

.model-item.active {
  border-color: var(--primary);
  background-color: var(--bg-active);
}

.model-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-name {
  font-weight: 600;
  font-size: 15px;
}

.model-desc {
  font-size: 13px;
  color: var(--text-sub);
}

.model-radio {
  color: var(--primary);
}

.logout-section {
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background-color: #ff4d4f1a;
  color: #ff4d4f;
  border: 1px solid #ff4d4f4d;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: #ff4d4f33;
}
</style>
