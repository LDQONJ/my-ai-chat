import request from '@/utils/request'

/**
 * 文件上传接口
 */
export const fileApi = {
  /**
   * 上传文件
   * @param {FormData} formData
   */
  upload(formData) {
    return request.post('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
