import axios from 'axios'

const host = import.meta.env.VITE_API_HOST

// 创建 axios 实例
const service = axios.create({
  baseURL: host,
  timeout: 60000, // SSE 聊天可能需要较长时间，设置较长的超时
})

// 请求拦截器：携带 JWT Token
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    // 如果返回的是流式数据，直接返回
    if (response.headers['content-type'] === 'text/event-stream') {
      return response
    }
    // 处理统一响应体 R
    if (res.code === 200) {
      return res.data
    } else {
      // 处理业务错误
      return Promise.reject(new Error(res.msg || 'Error'))
    }
  },
  error => {
    return Promise.reject(error)
  },
)

export default service
