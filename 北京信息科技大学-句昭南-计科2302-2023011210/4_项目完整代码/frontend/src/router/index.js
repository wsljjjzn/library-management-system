import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Layout from '@/views/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录与注册 - LibraryHub' }
  },
  {
    path: '/',
    component: Layout,
    redirect: () => {
      const token = localStorage.getItem('library_token')
      return token ? '/dashboard' : '/login'
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台概览' }
      },
      {
        path: 'books',
        name: 'Books',
        component: () => import('@/views/Books.vue'),
        meta: { title: '馆藏书目检索与管理' }
      },
      {
        path: 'my-borrows',
        name: 'MyBorrows',
        component: () => import('@/views/MyBorrows.vue'),
        meta: { title: '我的在借与借阅档案' }
      },
      {
        path: 'borrows',
        name: 'Borrows',
        component: () => import('@/views/Borrows.vue'),
        meta: { title: '全馆借还流转监控' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/Categories.vue'),
        meta: { title: '图书类目维护' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '读者借书证与用户管理' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 简化健壮的全局路由守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title}` : 'LibraryHub'
  const token = localStorage.getItem('library_token')

  if (to.path === '/login') {
    if (token) {
      return next('/dashboard')
    }
    return next()
  }

  // 其他受保护页面：若无 Token，一律重定向至 /login
  if (!token) {
    return next('/login')
  }

  next()
})

export default router
