<template>
  <div class="users-container">
    <div class="app-card mb-4 filter-card">
      <el-form :inline="true" :model="queryForm">
        <el-form-item label="读者搜索">
          <el-input 
            v-model="queryForm.keyword" 
            placeholder="姓名 / 用户名 / 借书证卡号 / 手机" 
            clearable 
            prefix-icon="Search"
            style="width: 280px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="系统角色">
          <el-select v-model="queryForm.role" placeholder="全部角色" clearable style="width: 140px;" @change="handleSearch">
            <el-option label="系统管理员" value="admin" />
            <el-option label="图书管理员" value="librarian" />
            <el-option label="普通读者" value="reader" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="app-card table-card">
      <el-table v-loading="loading" :data="users" stripe style="width: 100%">
        <el-table-column label="读者证号" prop="card_number" width="180">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.card_number }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="真实姓名 / 用户名" min-width="160">
          <template #default="{ row }">
            <div class="user-name-col">
              <strong>{{ row.full_name }}</strong>
              <span class="user-sub">@{{ row.username }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="角色身份" width="130">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'librarian' ? 'warning' : 'primary'" size="small">
              {{ row.role === 'admin' ? '系统管理员' : row.role === 'librarian' ? '图书管理员' : '普通读者' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="电子邮箱 / 手机" min-width="200">
          <template #default="{ row }">
            <div class="contact-col">
              <span>{{ row.email }}</span>
              <span class="phone-sub">{{ row.phone || '无电话' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="在借 / 上限额度" width="140" align="center">
          <template #default="{ row }">
            <span :class="row.current_borrow_count >= row.max_borrow_count ? 'text-red' : ''">
              <strong>{{ row.current_borrow_count || 0 }}</strong> / {{ row.max_borrow_count }} 本
            </span>
          </template>
        </el-table-column>

        <el-table-column label="账号状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? '正常' : '已冻结' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">设置额度</el-button>
            <el-button 
              :type="row.is_active ? 'danger' : 'success'" 
              size="small" 
              :disabled="row.role === 'admin'"
              @click="toggleStatus(row)"
            >
              {{ row.is_active ? '冻结' : '解冻' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-box">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.page_size"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="fetchUsers"
          @current-change="fetchUsers"
        />
      </div>
    </div>

    <!-- 额度与信息配置对话框 -->
    <el-dialog v-model="dialogVisible" title="读者借阅额度与档案维护" width="460px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="真实姓名">
          <el-input v-model="editForm.full_name" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="最大在借额度">
          <el-input-number v-model="editForm.max_borrow_count" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="重置密码">
          <el-input v-model="editForm.password" placeholder="留空则不修改原密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">保存更新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsersApi, updateUserApi, toggleUserStatusApi } from '@/api'

const loading = ref(false)
const users = ref([])
const total = ref(0)

const queryForm = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  role: ''
})

const dialogVisible = ref(false)
const editUserId = ref(null)
const submitting = ref(false)
const editForm = reactive({
  full_name: '',
  phone: '',
  max_borrow_count: 5,
  password: ''
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUsersApi(queryForm)
    users.value = res.data.items
    total.value = res.data.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryForm.page = 1
  fetchUsers()
}

const handleReset = () => {
  queryForm.keyword = ''
  queryForm.role = ''
  handleSearch()
}

const openEdit = (row) => {
  editUserId.value = row.id
  editForm.full_name = row.full_name
  editForm.phone = row.phone || ''
  editForm.max_borrow_count = row.max_borrow_count
  editForm.password = ''
  dialogVisible.value = true
}

const submitEdit = async () => {
  submitting.value = true
  try {
    const payload = {
      full_name: editForm.full_name,
      phone: editForm.phone,
      max_borrow_count: editForm.max_borrow_count
    }
    if (editForm.password) {
      payload.password = editForm.password
    }
    await updateUserApi(editUserId.value, payload)
    ElMessage.success('读者信息已成功更新')
    dialogVisible.value = false
    fetchUsers()
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
  }
}

const toggleStatus = (row) => {
  const nextStatus = !row.is_active
  const actionText = nextStatus ? '解冻启用' : '冻结停用'
  ElMessageBox.confirm(
    `确定要将读者【${row.full_name}】的借书证状态变更为【${actionText}】吗？`,
    '账号状态调整',
    {
      confirmButtonText: '确定变更',
      cancelButtonText: '取消',
      type: nextStatus ? 'info' : 'warning'
    }
  ).then(async () => {
    try {
      await toggleUserStatusApi(row.id, nextStatus)
      ElMessage.success(`已成功${actionText}`)
      fetchUsers()
    } catch (err) {
      console.error(err)
    }
  })
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-container {
  display: flex;
  flex-direction: column;
}

.mb-4 {
  margin-bottom: 20px;
}

.filter-card {
  padding: 16px 20px 0 20px;
}

.table-card {
  padding: 16px 20px;
}

.user-name-col {
  display: flex;
  flex-direction: column;
}

.user-sub {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
}

.contact-col {
  display: flex;
  flex-direction: column;
  font-size: 13px;
}

.phone-sub {
  font-size: 11px;
  color: #94a3b8;
}

.text-red {
  color: #ef4444;
}

.pagination-box {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
