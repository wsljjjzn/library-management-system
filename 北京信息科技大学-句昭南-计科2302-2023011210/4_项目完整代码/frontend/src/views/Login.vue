<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-icon">
          <el-icon size="36" color="#3b82f6"><Reading /></el-icon>
        </div>
        <h2 class="title">LibraryHub 图书借阅管理系统</h2>
        <p class="subtitle">现代化校园与公共馆藏综合智慧借阅平台</p>
      </div>

      <el-tabs v-model="activeTab" class="custom-tabs" stretch>
        <!-- 登录面板 -->
        <el-tab-pane label="账号登录" name="login">
          <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" class="mt-4">
            <el-form-item prop="username">
              <el-input 
                v-model="loginForm.username" 
                placeholder="请输入用户名" 
                prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                show-password 
                placeholder="请输入登录密码" 
                prefix-icon="Lock"
                size="large"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            
            <div class="quick-fill-box">
              <span class="quick-label">快速体验账号：</span>
              <el-button link type="primary" size="small" @click="fillQuick('admin', 'admin123')">系统管理员</el-button>
              <el-divider direction="vertical" />
              <el-button link type="primary" size="small" @click="fillQuick('librarian', 'lib123')">图书管理员</el-button>
              <el-divider direction="vertical" />
              <el-button link type="primary" size="small" @click="fillQuick('reader', 'reader123')">普通读者</el-button>
            </div>

            <el-button 
              type="primary" 
              size="large" 
              class="w-full submit-btn" 
              :loading="loading" 
              @click="handleLogin"
            >
              立即登录
            </el-button>
          </el-form>
        </el-tab-pane>

        <!-- 注册面板 -->
        <el-tab-pane label="读者自助注册" name="register">
          <el-form :model="regForm" :rules="regRules" ref="regFormRef" class="mt-4">
            <el-form-item prop="username">
              <el-input v-model="regForm.username" placeholder="设置用户名 (至少3位)" prefix-icon="User" size="large" />
            </el-form-item>
            <el-form-item prop="full_name">
              <el-input v-model="regForm.full_name" placeholder="真实姓名 / 读者姓名" prefix-icon="Postcard" size="large" />
            </el-form-item>
            <el-form-item prop="email">
              <el-input v-model="regForm.email" placeholder="电子邮箱 (如 student@univ.edu)" prefix-icon="Message" size="large" />
            </el-form-item>
            <el-form-item prop="phone">
              <el-input v-model="regForm.phone" placeholder="联系手机 (可选)" prefix-icon="Iphone" size="large" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="regForm.password" type="password" show-password placeholder="设置密码 (至少6位)" prefix-icon="Lock" size="large" />
            </el-form-item>
            <el-button 
              type="success" 
              size="large" 
              class="w-full submit-btn" 
              :loading="loading" 
              @click="handleRegister"
            >
              完成注册并开通借书证
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="footer-tip">
        <span>© 2026 LibraryHub 借阅系统 · Docker 部署版</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { loginApi, registerApi } from '@/api'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const loading = ref(false)

const loginFormRef = ref(null)
const loginForm = reactive({
  username: 'admin',
  password: 'admin123'
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const regFormRef = ref(null)
const regForm = reactive({
  username: '',
  full_name: '',
  email: '',
  phone: '',
  password: ''
})

const regRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  full_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  email: [{ required: true, message: '请输入有效邮箱', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码不能少于6位', trigger: 'blur' }]
}

const fillQuick = (u, p) => {
  loginForm.username = u
  loginForm.password = p
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await loginApi(loginForm)
      userStore.setAuth(res.data.access_token, res.data.user)
      ElMessage.success(`欢迎进入，${res.data.user.full_name || res.data.user.username}！`)
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
    } finally {
      loading.value = false
    }
  })
}

const handleRegister = async () => {
  if (!regFormRef.value) return
  await regFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await registerApi(regForm)
      ElMessage.success(`注册成功！已开通借书卡号：${res.data.card_number}，请直接登录`)
      loginForm.username = regForm.username
      loginForm.password = regForm.password
      activeTab.value = 'login'
    } catch (err) {
      console.error(err)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #f1f5f9 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  padding: 36px 32px;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo-icon {
  display: inline-flex;
  padding: 12px;
  background: #eff6ff;
  border-radius: 14px;
  margin-bottom: 12px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
}

.w-full {
  width: 100%;
}

.submit-btn {
  margin-top: 10px;
  font-weight: 600;
  border-radius: 8px;
}

.quick-fill-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 16px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.quick-label {
  color: #64748b;
}

.footer-tip {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: #94a3b8;
}
</style>
