import request from '@/utils/request'

/**
 * 模型接口
 */
export const modelApi = {
  /**
   * 切换模型
   * @param {string} modelId 模型ID
   */
  change(modelId) {
    return request.get('/model/change?id=' + modelId)
  },
  /**
   * 获取模型列表
   */
  list() {
    return request.get('/model/list')
  },
}
