import request from '@/utils/request'

/**
 * 更新接口
 */
export const updateApi = {
  /**
   * 检查更新
   * @param data "versionName"
   * @returns "yes" | "no"
   * @description 检查是否有新版本
   */
  checkUpdate(data) {
    return request.post('/updates/check', data)
  },
}
