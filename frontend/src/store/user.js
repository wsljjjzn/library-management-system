import { defineStore } from 'pinia'
import { getMeApi } from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('library_token') || '',
    userInfo: JSON.parse(localStorage.getItem('library_user') || 'null')
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.userInfo?.role === 'admin',
    isLibrarianOrAdmin: (state) => ['admin', 'librarian'].includes(state.userInfo?.role),
    isReader: (state) => state.userInfo?.role === 'reader'
  },
  actions: {
    setAuth(token, user) {
      this.token = token
      this.userInfo = user
      localStorage.setItem('library_token', token)
      localStorage.setItem('library_user', JSON.stringify(user))
    },
    async fetchUserInfo() {
      try {
        const res = await getMeApi()
        this.userInfo = res.data
        localStorage.setItem('library_user', JSON.stringify(res.data))
      } catch (err) {
        console.error('获取个人信息失败', err)
      }
    },
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('library_token')
      localStorage.removeItem('library_user')
    }
  }
})
