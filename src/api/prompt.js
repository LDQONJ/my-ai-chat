import request from '@/utils/request'

/**
 * 提示词接口
 */
export const promptApi = {
  /**
   * 设置全局提示词
   * @param {Object} data { persona, rules, example }

   */
  setGlobal(data) {
    return request.post('/prompt', data)
  },
  /**
   * 查询全局提示词
   */
  getGlobal() {
    return request.get('/prompt')
  },
  /**
   * 设置对话提示词
   * @param {Object} data { persona, rules, example }
   */
  setSession(id, data) {
    return request.post(`/prompt/${id}`, data)
  },
  /**
   * 查询对话提示词
   */
  getSession(id) {
    return request.get(`/prompt/${id}`)
  },
}
