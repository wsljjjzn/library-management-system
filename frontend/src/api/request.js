import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api/v1',
  timeout: 10000
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('library_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data
    // 兼容标准结构 { code: 200, message: "...", data: ... }
    if (res.code && res.code !== 200) {
      ElMessage.error(res.message || '请求处理失败')
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      const errorMsg = error.response.data?.detail || error.response.data?.message || '网络或服务器异常'

      if (status === 401) {
        ElMessage.error('登录状态已失效，请重新登录')
        localStorage.removeItem('library_token')
        localStorage.removeItem('library_user')
        window.location.href = '/login'
      } else if (status === 403) {
        ElMessage.error('权限不足，当前角色无法执行此操作')
      } else {
        ElMessage.error(errorMsg)
      }
    } else {
      ElMessage.error('网络连接失败，请检查服务器网络或稍后重试')
    }
    return Promise.reject(error)
  }
)

export default service
