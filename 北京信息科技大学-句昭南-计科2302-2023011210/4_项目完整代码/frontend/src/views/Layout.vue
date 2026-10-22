<template>
  <el-container class="layout-wrapper">
    <!-- 侧边导航栏 -->
    <el-aside :width="isCollapse ? '64px' : '230px'" class="aside-menu">
      <div class="logo-area">
        <el-icon size="24" color="#3b82f6"><Reading /></el-icon>
        <span v-if="!isCollapse" class="logo-text">LibraryHub</span>
      </div>

      <el-menu
        :default-active="activeRoute"
        class="custom-el-menu"
        :collapse="isCollapse"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>统计看板</template>
        </el-menu-item>

        <el-menu-item index="/books">
          <el-icon><Reading /></el-icon>
          <template #title>馆藏书目检索</template>
        </el-menu-item>

        <el-menu-item index="/my-borrows">
          <el-icon><Tickets /></el-icon>
          <template #title>我的借阅档案</template>
        </el-menu-item>

        <el-menu-item v-if="isLibrarianOrAdmin" index="/borrows">
          <el-icon><List /></el-icon>
          <template #title>借还流转大厅</template>
        </el-menu-item>

        <el-menu-item v-if="isLibrarianOrAdmin" index="/categories">
          <el-icon><CollectionTag /></el-icon>
          <template #title>图书类目维护</template>
        </el-menu-item>

        <el-menu-item v-if="isLibrarianOrAdmin" index="/users">
          <el-icon><UserFilled /></el-icon>
          <template #title>读者证件管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主体区域 -->
    <el-container>
      <!-- 顶栏 -->
      <el-header class="top-header">
        <div class="header-left">
          <el-button 
            type="text" 
            class="toggle-btn" 
            @click="isCollapse = !isCollapse"
          >
            <el-icon size="20">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
          </el-button>
          <span class="page-title">{{ currentRouteTitle }}</span>
        </div>

        <div class="header-right">
          <!-- 读者证信息徽标 -->
          <el-tag v-if="userInfo?.card_number" type="info" effect="plain" class="card-tag">
            <el-icon><Postcard /></el-icon>
            <span style="margin-left: 4px;">{{ userInfo.card_number }}</span>
          </el-tag>

          <!-- 角色标签 -->
          <el-tag :type="roleTagType" size="small" class="role-tag">
            {{ roleName }}
          </el-tag>

          <!-- 用户下拉 -->
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown-link">
              <el-avatar :size="32" class="user-avatar">
                {{ (userInfo?.full_name || userInfo?.username || 'U')[0] }}
              </el-avatar>
              <span class="username-text">{{ userInfo?.full_name || userInfo?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人资信档案
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出系统
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容视窗 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <!-- 个人资信抽屉/弹窗 -->
    <el-dialog v-model="profileVisible" title="个人借阅资信档案" width="460px">
      <div class="profile-details" v-if="detailUser">
        <el-descriptions :column="1" border size="default">
          <el-descriptions-item label="登录账号">{{ detailUser.username }}</el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ detailUser.full_name }}</el-descriptions-item>
          <el-descriptions-item label="借书证号">
            <el-tag type="success">{{ detailUser.card_number }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="身份角色">
            <el-tag :type="roleTagType">{{ roleName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="电子邮箱">{{ detailUser.email }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detailUser.phone || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="最大借书上限">{{ detailUser.max_borrow_count }} 本</el-descriptions-item>
          <el-descriptions-item label="当前在借数量">
            <span style="font-weight: bold; color: #3b82f6;">{{ detailUser.current_borrow_count || 0 }}</span> 本
          </el-descriptions-item>
          <el-descriptions-item label="逾期限制状态">
            <el-tag v-if="detailUser.has_overdue" type="danger">有逾期违规，暂停借阅</el-tag>
            <el-tag v-else type="success">资信良好，正常借阅</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button type="primary" @click="profileVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { getMeApi } from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const profileVisible = ref(false)
const detailUser = ref(null)

const activeRoute = computed(() => route.path)
const currentRouteTitle = computed(() => route.meta?.title || '图书借阅系统')
const userInfo = computed(() => userStore.userInfo)
const isLibrarianOrAdmin = computed(() => userStore.isLibrarianOrAdmin)

const roleName = computed(() => {
  const role = userInfo.value?.role
  if (role === 'admin') return '系统管理员'
  if (role === 'librarian') return '图书管理员'
  return '注册读者'
})

const roleTagType = computed(() => {
  const role = userInfo.value?.role
  if (role === 'admin') return 'danger'
  if (role === 'librarian') return 'warning'
  return 'primary'
})

onMounted(() => {
  userStore.fetchUserInfo()
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('您确定要注销登录退出系统吗？', '提示', {
      confirmButtonText: '确定退出',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      ElMessage.success('已安全退出')
      router.push('/login')
    })
  } else if (command === 'profile') {
    try {
      const res = await getMeApi()
      detailUser.value = res.data
      profileVisible.value = true
    } catch (err) {
      ElMessage.error('获取个人资信档案失败')
    }
  }
}
</script>

<style scoped>
.layout-wrapper {
  height: 100vh;
  width: 100%;
}

.aside-menu {
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.5px;
}

.custom-el-menu {
  border-right: none;
  flex: 1;
}

.top-header {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-btn {
  color: #64748b;
  padding: 0;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.card-tag {
  font-size: 12px;
  font-family: monospace;
}

.user-dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #334155;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.user-dropdown-link:hover {
  background: #f1f5f9;
}

.user-avatar {
  background-color: #3b82f6;
  color: #ffffff;
  font-weight: 600;
}

.username-text {
  font-size: 14px;
  font-weight: 500;
}

.main-content {
  background-color: #f8fafc;
  padding: 24px;
  overflow-y: auto;
}
</style>
