import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录与注册 - LibraryHub', public: true }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台概览', icon: 'Odometer' }
      },
      {
        path: 'books',
        name: 'Books',
        component: () => import('@/views/Books.vue'),
        meta: { title: '馆藏书目检索与管理', icon: 'Reading' }
      },
      {
        path: 'my-borrows',
        name: 'MyBorrows',
        component: () => import('@/views/MyBorrows.vue'),
        meta: { title: '我的在借与借阅档案', icon: 'Tickets' }
      },
      {
        path: 'borrows',
        name: 'Borrows',
        component: () => import('@/views/Borrows.vue'),
        meta: { title: '全馆借还流转监控', icon: 'List', roles: ['admin', 'librarian'] }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/Categories.vue'),
        meta: { title: '图书类目维护', icon: 'CollectionTag', roles: ['admin', 'librarian'] }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '读者借书证与用户管理', icon: 'UserFilled', roles: ['admin', 'librarian'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title}` : 'LibraryHub'
  const token = localStorage.getItem('library_token')
  const user = JSON.parse(localStorage.getItem('library_user') || '{}')

  if (!to.meta.public && !token) {
    return next({ path: '/login' })
  }

  if (to.path === '/login' && token) {
    return next({ path: '/dashboard' })
  }

  // 权限控制拦截
  if (to.meta.roles && !to.meta.roles.includes(user.role)) {
    return next({ path: '/dashboard' })
  }

  next()
})

export default router
