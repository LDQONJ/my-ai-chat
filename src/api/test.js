import axios from 'axios';

const host = import.meta.env.VITE_API_HOST;
// 创建 axios 实例
const service = axios.create({
  baseURL: host, // 根据 application.yaml 中的 server.port 配置
  timeout: 60000, // SSE 聊天可能需要较长时间，设置较长的超时
});

// 请求拦截器：携带 JWT Token
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    // 如果返回的是流式数据，直接返回
    if (response.headers['content-type'] === 'text/event-stream') {
      return response;
    }
    // 处理统一响应体 R
    if (res.code === 200) {
      return res.data;
    } else {
      // 处理业务错误
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  error => {
    return Promise.reject(error);
  },
);

/**
 * 用户管理接口
 */
export const userApi = {
  /**
   * 用户注册
   * @param {Object} data { username, password, email, phone, code }
   */
  register(data) {
    return service.post('/users/register', data);
  },
  /**
   * 用户登录
   * @param {Object} data { username, password, email, phone, code }
   */
  login(data) {
    return service.post('/users/login', data);
  },

  /**
   * 用户信息
   */
  me() {
    return service.get('/users/me');
  },
};

/**
 * 文件上传接口
 */
export const fileApi = {
  /**
   * 上传文件
   * @param {FormData} formData
   */
  upload(formData) {
    return service.post('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

/**
 * 验证码接口
 */
export const codeApi = {
  /**
   * 发送验证码
   * @param {string} target 目标地址 (邮箱/手机号)
   */
  sendCode(target) {
    return service.get('/verifyCode', { params: { target } });
  },
};

/**
 * 聊天会话管理接口
 */
export const sessionApi = {
  /**
   * 创建新会话
   */
  create() {
    return service.get('/session/create');
  },
  /**
   * 获取当前用户的会话列表
   */
  list() {
    return service.get('/session/list');
  },
  /**
   * 重命名会话
   * @param {string} id 会话ID
   * @param {string} title 新标题
   */
  rename(id, title) {
    return service.put('/session', null, { params: { id, title } });
  },
  /**
   * 删除会话
   * @param {string} id 会话ID
   */
  delete(id) {
    return service.delete(`/session/${id}`);
  },
  /**
   * 根据ID查询会话详情
   * @param {string} id 会话ID
   */
  queryById(id) {
    return service.get(`/session/${id}`);
  },
};
