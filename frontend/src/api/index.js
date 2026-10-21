import request from './request'

// 认证与用户
export const loginApi = (data) => request.post('/auth/login', data)
export const registerApi = (data) => request.post('/auth/register', data)
export const getMeApi = () => request.get('/auth/me')

// 分类管理
export const getCategoriesApi = () => request.get('/categories')
export const createCategoryApi = (data) => request.post('/categories', data)
export const updateCategoryApi = (id, data) => request.put(`/categories/${id}`, data)
export const deleteCategoryApi = (id) => request.delete(`/categories/${id}`)

// 图书管理与检索
export const getBooksApi = (params) => request.get('/books', { params })
export const getBookDetailApi = (id) => request.get(`/books/${id}`)
export const createBookApi = (data) => request.post('/books', data)
export const updateBookApi = (id, data) => request.put(`/books/${id}`, data)
export const deleteBookApi = (id) => request.delete(`/books/${id}`)

// 借还与流转
export const borrowBookApi = (data) => request.post('/borrows/borrow', data)
export const returnBookApi = (recordId, data) => request.post(`/borrows/return/${recordId}`, data)
export const renewBookApi = (recordId) => request.post(`/borrows/renew/${recordId}`)
export const getMyBorrowsApi = (params) => request.get('/borrows/my', { params })
export const getAllBorrowsApi = (params) => request.get('/borrows/all', { params })

// 读者与用户管理 (管理员)
export const getUsersApi = (params) => request.get('/users', { params })
export const updateUserApi = (id, data) => request.put(`/users/${id}`, data)
export const toggleUserStatusApi = (id, isActive) => request.put(`/users/${id}/status?is_active=${isActive}`)

// 看板统计
export const getStatsOverviewApi = () => request.get('/stats/overview')
export const getStatsTrendsApi = () => request.get('/stats/trends')
