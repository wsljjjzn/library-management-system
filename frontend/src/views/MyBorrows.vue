<template>
  <div class="my-borrows-container">
    <!-- 个人借书证信息药丸横幅 -->
    <div class="app-card mb-4 card-banner" v-if="userInfo">
      <div class="banner-left">
        <el-icon size="36" color="#3b82f6"><Postcard /></el-icon>
        <div class="card-meta">
          <span class="user-name-title">{{ userInfo.full_name || userInfo.username }} 的读者借书证</span>
          <span class="card-number-mono">卡号：{{ userInfo.card_number }}</span>
        </div>
      </div>
      <div class="banner-right">
        <div class="quota-box">
          <span class="quota-label">当前在借本数</span>
          <span class="quota-val">{{ userInfo.current_borrow_count || 0 }} / {{ userInfo.max_borrow_count || 5 }} 本</span>
        </div>
        <div class="quota-box">
          <span class="quota-label">借阅信用评级</span>
          <el-tag v-if="userInfo.has_overdue" type="danger" effect="dark">存在超期阻断</el-tag>
          <el-tag v-else type="success" effect="dark">信用优秀 (AAA)</el-tag>
        </div>
      </div>
    </div>

    <!-- 借还记录选项卡与列表 -->
    <div class="app-card table-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="当前在借图书" name="BORROWED">
          <template #label>
            <span>
              <el-icon><Clock /></el-icon> 当前在借
            </span>
          </template>
        </el-tab-pane>

        <el-tab-pane label="历史归还记录" name="RETURNED">
          <template #label>
            <span>
              <el-icon><CircleCheck /></el-icon> 历史已还
            </span>
          </template>
        </el-tab-pane>

        <el-tab-pane label="逾期提醒与催还" name="OVERDUE">
          <template #label>
            <span>
              <el-icon><Warning /></el-icon> 逾期单据
            </span>
          </template>
        </el-tab-pane>

        <el-tab-pane label="全部单据流水" name="">
          <template #label>
            <span>
              <el-icon><Tickets /></el-icon> 全部历史
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <el-table v-loading="loading" :data="records" stripe style="width: 100%" class="mt-2">
        <el-table-column label="借阅流水号" prop="record_no" width="180">
          <template #default="{ row }">
            <span class="mono-code">{{ row.record_no }}</span>
          </template>
        </el-table-column>

        <el-table-column label="图书信息" min-width="240">
          <template #default="{ row }">
            <div class="book-info-col">
              <span class="title-bold">{{ row.book_title || '图书 ID: ' + row.book_id }}</span>
              <span class="isbn-sub">ISBN: {{ row.book_isbn || '-' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="借出日期" width="160">
          <template #default="{ row }">
            <span>{{ formatDate(row.borrow_date) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="应还日期" width="160">
          <template #default="{ row }">
            <span :class="isOverdue(row) ? 'text-danger-bold' : ''">
              {{ formatDate(row.due_date) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="实际归还时间" width="160">
          <template #default="{ row }">
            <span>{{ row.return_date ? formatDate(row.return_date) : '尚未归还' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="流转状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'RETURNED'" type="success" size="small">已归还</el-tag>
            <el-tag v-else-if="row.status === 'OVERDUE'" type="danger" size="small" effect="dark">已逾期</el-tag>
            <el-tag v-else type="primary" size="small">借阅中</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="续借与滞纳金" width="140">
          <template #default="{ row }">
            <div class="fee-col">
              <span v-if="row.renew_count > 0" class="renew-text">已续借 {{ row.renew_count }} 次</span>
              <span v-if="row.penalty_fee > 0" class="penalty-text">滞纳金: ￥{{ row.penalty_fee.toFixed(2) }}</span>
              <span v-if="row.renew_count === 0 && row.penalty_fee === 0" class="normal-text">借期正常</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="业务操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'BORROWED'">
              <!-- 续借按钮 -->
              <el-button 
                type="warning" 
                size="small" 
                :disabled="row.renew_count >= 1 || isOverdue(row)" 
                @click="handleRenew(row)"
              >
                {{ row.renew_count >= 1 ? '已达续借上限' : '在线续借' }}
              </el-button>
              
              <!-- 线上还书按钮 -->
              <el-button 
                type="success" 
                size="small" 
                @click="handleReturn(row)"
              >
                归还图书
              </el-button>
            </template>
            <template v-else-if="row.status === 'OVERDUE'">
              <el-button 
                type="danger" 
                size="small" 
                @click="handleReturn(row)"
              >
                结清并还书
              </el-button>
            </template>
            <span v-else class="text-muted">单据已结清</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div class="pagination-box">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="fetchMyBorrows"
          @current-change="fetchMyBorrows"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyBorrowsApi, renewBookApi, returnBookApi } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const activeTab = ref('BORROWED')
const loading = ref(false)
const records = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const formatDate = (val) => {
  if (!val) return '-'
  return val.replace('T', ' ').substring(0, 19)
}

const isOverdue = (row) => {
  if (row.status === 'OVERDUE') return true
  if (row.status === 'BORROWED') {
    return new Date(row.due_date) < new Date()
  }
  return false
}

const fetchMyBorrows = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      page_size: pageSize.value,
      status: activeTab.value || undefined
    }
    const res = await getMyBorrowsApi(params)
    records.value = res.data.items
    total.value = res.data.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  page.value = 1
  fetchMyBorrows()
}

// 办理续借
const handleRenew = (row) => {
  ElMessageBox.confirm(
    `确定要对《${row.book_title}》办理续借吗？单本书籍仅限续借一次，借期将自原应还日期顺延30天。`,
    '续借申请确认',
    {
      confirmButtonText: '确认续借',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await renewBookApi(row.id)
      ElMessage.success(res.message || '续借成功！')
      fetchMyBorrows()
    } catch (err) {
      console.error(err)
    }
  })
}

// 办理还书
const handleReturn = (row) => {
  const isOver = isOverdue(row)
  const tip = isOver 
    ? `该书已逾期，归还时系统将计算并结算滞纳金。确认立即归还《${row.book_title}》吗？`
    : `您确认要归还图书《${row.book_title}》吗？归还后图书库存将立即回补入库。`

  ElMessageBox.confirm(tip, '图书归还核对', {
    confirmButtonText: '确认归还',
    cancelButtonText: '取消',
    type: isOver ? 'error' : 'info'
  }).then(async () => {
    try {
      const res = await returnBookApi(row.id)
      ElMessage.success(res.message || '图书归还成功！')
      fetchMyBorrows()
      userStore.fetchUserInfo()
    } catch (err) {
      console.error(err)
    }
  })
}

onMounted(() => {
  userStore.fetchUserInfo()
  fetchMyBorrows()
})
</script>

<style scoped>
.my-borrows-container {
  display: flex;
  flex-direction: column;
}

.mb-4 {
  margin-bottom: 20px;
}

.card-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(to right, #ffffff, #f0fdf4);
  border-left: 4px solid #3b82f6;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-meta {
  display: flex;
  flex-direction: column;
}

.user-name-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.card-number-mono {
  font-size: 13px;
  color: #64748b;
  font-family: monospace;
  margin-top: 4px;
}

.banner-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.quota-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.quota-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.quota-val {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.table-card {
  padding: 16px 20px;
}

.mono-code {
  font-family: monospace;
  font-size: 12px;
  color: #475569;
}

.book-info-col {
  display: flex;
  flex-direction: column;
}

.title-bold {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.isbn-sub {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.text-danger-bold {
  color: #ef4444;
  font-weight: 600;
}

.fee-col {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.renew-text {
  color: #f59e0b;
}

.penalty-text {
  color: #ef4444;
  font-weight: 600;
}

.normal-text {
  color: #10b981;
}

.text-muted {
  font-size: 12px;
  color: #94a3b8;
}

.pagination-box {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
