import request from '@/utils/request'

/**
 * 聊天会话管理接口
 */
export const sessionApi = {
  /**
   * 创建新会话
   */
  create() {
    return request.get('/session/create')
  },
  /**
   * 获取当前用户的会话列表
   */
  list() {
    return request.get('/session/list')
  },
  /**
   * 重命名会话
   * @param {string} id 会话ID
   * @param {string} title 新标题
   */
  rename(id, title) {
    return request.put('/session', null, { params: { id, title } })
  },
  /**
   * 删除会话
   * @param {string} id 会话ID
   */
  delete(id) {
    return request.delete(`/session/${id}`)
  },
  /**
   * 根据ID查询会话详情
   * @param {string} id 会话ID
   */
  queryById(id) {
    return request.get(`/session/${id}`)
  },
}
