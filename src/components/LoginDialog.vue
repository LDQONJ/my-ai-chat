<template>
  <div v-if="visible" class="dialog-overlay" @click="close">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h2>{{ isLoginMode ? '登录' : '注册' }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="dialog-body">
        <div class="form-item">
          <label>用户名</label>
          <input v-model="form.username" type="text" placeholder="请输入用户名" required />
        </div>
        
        <div v-if="!isLoginMode" class="form-item">
          <label>邮箱</label>
          <div class="input-with-btn">
            <input v-model="form.email" type="email" placeholder="请输入邮箱" required />
            <button type="button" :disabled="sendingCode" @click="handleSendCode">
              {{ sendingCode ? `${countdown}s` : '获取验证码' }}
            </button>
          </div>
        </div>

        <div v-if="!isLoginMode" class="form-item">
          <label>验证码</label>
          <input v-model="form.code" type="text" placeholder="请输入验证码" required />
        </div>

        <div class="form-item">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" required />
        </div>

        <div class="form-actions">
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? '处理中...' : (isLoginMode ? '登录' : '注册') }}
          </button>
          <div class="mode-switch">
            {{ isLoginMode ? '没有账号?' : '已有账号?' }}
            <a href="javascript:void(0)" @click="isLoginMode = !isLoginMode">
              {{ isLoginMode ? '立即注册' : '立即登录' }}
            </a>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { userApi, codeApi } from '@/api/test'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { lo } from 'element-plus/es/locale/index.mjs';

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible', 'success'])

const userStore = useUserStore()
const isLoginMode = ref(true)
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(60)

const form = reactive({
  username: '',
  password: '',
  email: '',
  code: ''
})

const close = () => {
  emit('update:visible', false)
  // 重置表单
  form.username = ''
  form.password = ''
  form.email = ''
  form.code = ''
}

const handleSendCode = async () => {
  if (!form.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }
  
  try {
    sendingCode.value = true
    await codeApi.sendCode(form.email)
    ElMessage.success('验证码已发送')
    
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        sendingCode.value = false
        countdown.value = 60
      }
    }, 1000)
  } catch (err) {
    ElMessage.error(err.message || '发送失败')
    sendingCode.value = false
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    let token
    if (isLoginMode.value) {
      token = await userApi.login({
        username: form.username,
        password: form.password
      })
    } else {
      token = await userApi.register({
        username: form.username,
        password: form.password,
        email: form.email,
        code: form.code
      })
    }
    
    if (token) {
      localStorage.setItem('token', token)
      const userInfo = await userApi.me()
      if (userInfo) {
        userStore.setUserInfo(userInfo || { username: form.username, email: form.email })
      }
      emit('success')
      close()
    } else {
      throw new Error('响应数据异常')
    }
  } catch (err) {
    ElMessage.error(err.message || (isLoginMode.value ? '登录失败' : '注册失败'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: var(--bg-sidebar);
  width: 400px;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  color: var(--text-main);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-sub);
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-sub);
}

.form-item input {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-active);
  color: var(--text-main);
  outline: none;
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn button {
  padding: 0 12px;
  border-radius: 6px;
  border: none;
  background: var(--bg-hover);
  color: var(--text-main);
  cursor: pointer;
  white-space: nowrap;
}

.input-with-btn button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: none;
  background: #409eff;
  color: white;
  font-size: 16px;
  cursor: pointer;
  margin-top: 16px;
}

.submit-btn:disabled {
  background: #a0cfff;
}

.mode-switch {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: var(--text-sub);
}

.mode-switch a {
  color: #409eff;
  text-decoration: none;
  margin-left: 4px;
}
</style>
