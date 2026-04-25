import request from '@/utils/request'

/**
 * 用户管理接口
 */
export const userApi = {
  /**
   * 用户注册
   * @param {Object} data { username, password, email, phone, code }
   */
  register(data) {
    return request.post('/users/register', data)
  },
  /**
   * 用户登录
   * @param {Object} data { username, password, email, phone, code }
   */
  login(data) {
    return request.post('/auth/login', data)
  },

  /**
   * 用户信息
   */
  me() {
    return request.get('/users/me')
  },

  /**
   * 更新用户信息
   * @param {Object} data { username, email, phone, avatar }
   */
  update(data) {
    return request.put('/users', data)
  },
}
