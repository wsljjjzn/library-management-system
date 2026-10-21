<template>
  <div class="borrows-container">
    <!-- 过滤与综合检索栏 -->
    <div class="app-card mb-4 filter-card">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="综合检索">
          <el-input 
            v-model="queryForm.keyword" 
            placeholder="借阅单号 / 读者姓名 / 卡号 / 书名" 
            clearable 
            prefix-icon="Search"
            style="width: 280px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="流转状态">
          <el-select 
            v-model="queryForm.status" 
            placeholder="全部状态" 
            clearable 
            style="width: 150px;"
            @change="handleSearch"
          >
            <el-option label="借阅中" value="BORROWED" />
            <el-option label="已逾期未还" value="OVERDUE" />
            <el-option label="已归还入库" value="RETURNED" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询流水</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 流转流水列表 -->
    <div class="app-card table-card">
      <el-table v-loading="loading" :data="records" stripe style="width: 100%">
        <el-table-column label="借阅单据号" prop="record_no" width="180">
          <template #default="{ row }">
            <span class="mono-font">{{ row.record_no }}</span>
          </template>
        </el-table-column>

        <el-table-column label="读者身份信息" min-width="180">
          <template #default="{ row }">
            <div class="user-meta-cell">
              <span class="name-text">{{ row.user_name || '用户#' + row.user_id }}</span>
              <span class="card-text">{{ row.user_card_number }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="借阅图书" min-width="200">
          <template #default="{ row }">
            <div class="book-meta-cell">
              <span class="book-title">{{ row.book_title || '图书#' + row.book_id }}</span>
              <span class="book-isbn">ISBN: {{ row.book_isbn || '-' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="借出日期" width="160">
          <template #default="{ row }">
            <span>{{ formatDate(row.borrow_date) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="约定应还日期" width="160">
          <template #default="{ row }">
            <span :class="isOverdue(row) ? 'text-red' : ''">{{ formatDate(row.due_date) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="实际归还时间" width="160">
          <template #default="{ row }">
            <span>{{ row.return_date ? formatDate(row.return_date) : '尚未归还' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'RETURNED'" type="success" size="small">已归还</el-tag>
            <el-tag v-else-if="row.status === 'OVERDUE'" type="danger" size="small" effect="dark">已逾期</el-tag>
            <el-tag v-else type="primary" size="small">在借流通</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="续借/滞纳金" width="130">
          <template #default="{ row }">
            <div class="fee-col">
              <span v-if="row.renew_count > 0" class="text-orange">续借{{ row.renew_count }}次</span>
              <span v-if="row.penalty_fee > 0" class="text-red">罚金: ￥{{ row.penalty_fee.toFixed(2) }}</span>
              <span v-if="row.renew_count === 0 && row.penalty_fee === 0" class="text-gray">正常</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="柜台核验操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status !== 'RETURNED'">
              <el-button 
                type="success" 
                size="small" 
                @click="handleAdminReturn(row)"
              >
                代办验收还书
              </el-button>
            </template>
            <span v-else class="text-muted">已结清入库</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div class="pagination-box">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.page_size"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="fetchBorrows"
          @current-change="fetchBorrows"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAllBorrowsApi, returnBookApi } from '@/api'

const loading = ref(false)
const records = ref([])
const total = ref(0)

const queryForm = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  status: ''
})

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

const fetchBorrows = async () => {
  loading.value = true
  try {
    const res = await getAllBorrowsApi(queryForm)
    records.value = res.data.items
    total.value = res.data.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryForm.page = 1
  fetchBorrows()
}

const handleReset = () => {
  queryForm.keyword = ''
  queryForm.status = ''
  handleSearch()
}

const handleAdminReturn = (row) => {
  const isOver = isOverdue(row)
  ElMessageBox.prompt(
    `正在办理读者【${row.user_name}】归还《${row.book_title}》的验收手续。${isOver ? '（该单据已逾期，请确认收缴滞纳金）' : ''} 可填写经办备注：`,
    '代办验收还书',
    {
      confirmButtonText: '确认验收并回补库存',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：图书品相完好，已核销入库'
    }
  ).then(async ({ value }) => {
    try {
      const res = await returnBookApi(row.id, { remark: value || '管理员柜台验收归还' })
      ElMessage.success(res.message || '还书验收成功！')
      fetchBorrows()
    } catch (err) {
      console.error(err)
    }
  })
}

onMounted(() => {
  fetchBorrows()
})
</script>

<style scoped>
.borrows-container {
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

.mono-font {
  font-family: monospace;
  font-size: 12px;
  color: #334155;
}

.user-meta-cell {
  display: flex;
  flex-direction: column;
}

.name-text {
  font-weight: 600;
  color: #1e293b;
}

.card-text {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
}

.book-meta-cell {
  display: flex;
  flex-direction: column;
}

.book-title {
  font-weight: 500;
  color: #1e293b;
}

.book-isbn {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.text-red {
  color: #ef4444;
  font-weight: 600;
}

.text-orange {
  color: #f59e0b;
}

.text-gray {
  color: #94a3b8;
}

.text-muted {
  font-size: 12px;
  color: #94a3b8;
}

.fee-col {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.pagination-box {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
