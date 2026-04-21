import request from '@/utils/request'

/**
 * 验证码接口
 */
export const codeApi = {
  /**
   * 发送验证码
   * @param {string} target 目标地址 (邮箱/手机号)
   */
  sendCode(target) {
    return request.get('/verifyCode', { params: { target } })
  },
}
