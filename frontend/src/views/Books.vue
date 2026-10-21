<template>
  <div class="books-container">
    <!-- 顶部过滤与操作栏 -->
    <div class="app-card mb-4 filter-card">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="关键词检索">
          <el-input 
            v-model="queryForm.keyword" 
            placeholder="书名 / 作者 / ISBN / 出版社" 
            clearable 
            prefix-icon="Search"
            style="width: 240px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="图书分类">
          <el-select 
            v-model="queryForm.category_id" 
            placeholder="全部分类" 
            clearable 
            style="width: 180px;"
            @change="handleSearch"
          >
            <el-option 
              v-for="cat in categories" 
              :key="cat.id" 
              :label="cat.name" 
              :value="cat.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="queryForm.available_only" @change="handleSearch">
            仅看在架可借
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">检索</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>

        <el-form-item v-if="isLibrarianOrAdmin" style="margin-left: auto;">
          <el-button type="success" icon="Plus" @click="openCreateDialog">
            新书入库编目
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 图书数据列表表格 -->
    <div class="app-card table-card">
      <el-table 
        v-loading="loading" 
        :data="books" 
        stripe 
        style="width: 100%"
        row-key="id"
      >
        <el-table-column label="封面" width="80" align="center">
          <template #default="{ row }">
            <el-image 
              :src="row.cover_url || defaultCover" 
              fit="cover" 
              class="book-thumb"
              :preview-src-list="[row.cover_url || defaultCover]"
              preview-teleported
            >
              <template #error>
                <div class="thumb-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>

        <el-table-column label="书名与标准ISBN" min-width="220">
          <template #default="{ row }">
            <div class="book-title-cell">
              <span class="title-text" :title="row.title">{{ row.title }}</span>
              <span class="isbn-text">ISBN: {{ row.isbn }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="著者 / 出版社" min-width="160">
          <template #default="{ row }">
            <div class="author-cell">
              <span>{{ row.author }}</span>
              <span class="pub-text">{{ row.publisher || '未知出版社' }} ({{ row.publish_date || '未注明' }})</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属分类" width="140">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.category_name || '未分类' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="在架 / 馆藏总数" width="160" align="center">
          <template #default="{ row }">
            <div class="stock-cell">
              <span class="stock-label">
                <strong :class="row.available_copies > 0 ? 'text-green' : 'text-red'">{{ row.available_copies }}</strong>
                / {{ row.total_copies }} 册
              </span>
              <el-progress 
                :percentage="Math.round((row.available_copies / row.total_copies) * 100)" 
                :status="row.available_copies > 0 ? 'success' : 'exception'" 
                :stroke-width="6"
                :show-text="false"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="架位索书号" width="120" prop="location">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.location || '1F-A01' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="业务操作" width="220" fixed="right">
          <template #default="{ row }">
            <!-- 读者借阅按钮 -->
            <el-button 
              type="primary" 
              size="small" 
              :disabled="row.available_copies <= 0"
              @click="handleBorrow(row)"
            >
              {{ row.available_copies > 0 ? '立即借阅' : '暂无库存' }}
            </el-button>

            <!-- 管理员编辑 & 下架 -->
            <template v-if="isLibrarianOrAdmin">
              <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="handleDelete(row)"
              >
                下架
              </el-button>
            </template>
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
          @size-change="fetchBooks"
          @current-change="fetchBooks"
        />
      </div>
    </div>

    <!-- 图书录入 / 编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑馆藏图书信息' : '新书编目入库登记'" 
      width="600px"
      destroy-on-close
    >
      <el-form :model="bookForm" :rules="bookRules" ref="bookFormRef" label-width="110px">
        <el-form-item label="标准ISBN" prop="isbn">
          <el-input v-model="bookForm.isbn" :disabled="isEdit" placeholder="如 9787111544937" />
        </el-form-item>

        <el-form-item label="图书正题名" prop="title">
          <el-input v-model="bookForm.title" placeholder="请输入完整图书书名" />
        </el-form-item>

        <el-form-item label="著者/译者" prop="author">
          <el-input v-model="bookForm.author" placeholder="作者姓名" />
        </el-form-item>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="出版社" prop="publisher">
              <el-input v-model="bookForm.publisher" placeholder="如 人民邮电出版社" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出版年月" prop="publish_date">
              <el-input v-model="bookForm.publish_date" placeholder="如 2024-05" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="图书分类" prop="category_id">
              <el-select v-model="bookForm.category_id" placeholder="选择分类" style="width: 100%;">
                <el-option 
                  v-for="cat in categories" 
                  :key="cat.id" 
                  :label="cat.name" 
                  :value="cat.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="馆藏总册数" prop="total_copies">
              <el-input-number v-model="bookForm.total_copies" :min="1" :max="9999" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="馆藏架位号" prop="location">
          <el-input v-model="bookForm.location" placeholder="如 3F-计算机区-A02架" />
        </el-form-item>

        <el-form-item label="封面图片URL" prop="cover_url">
          <el-input v-model="bookForm.cover_url" placeholder="https://..." />
        </el-form-item>

        <el-form-item label="导读与简介" prop="summary">
          <el-input v-model="bookForm.summary" type="textarea" :rows="3" placeholder="图书核心内容提要..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitBookForm">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBooksApi, getCategoriesApi, borrowBookApi, createBookApi, updateBookApi, deleteBookApi } from '@/api'
import { useUserStore } from '@/store/user'

const route = useRoute()
const userStore = useUserStore()
const isLibrarianOrAdmin = computed(() => userStore.isLibrarianOrAdmin)

const defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=60'

const loading = ref(false)
const books = ref([])
const categories = ref([])
const total = ref(0)

const queryForm = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  category_id: null,
  available_only: false
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const editBookId = ref(null)
const submitting = ref(false)
const bookFormRef = ref(null)

const bookForm = reactive({
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  publish_date: '',
  category_id: null,
  total_copies: 5,
  location: '1F-A01',
  cover_url: '',
  summary: ''
})

const bookRules = {
  isbn: [{ required: true, message: '请输入标准ISBN', trigger: 'blur' }],
  title: [{ required: true, message: '请输入图书题名', trigger: 'blur' }],
  author: [{ required: true, message: '请输入著者信息', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择图书分类', trigger: 'change' }]
}

const fetchCategories = async () => {
  try {
    const res = await getCategoriesApi()
    categories.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const fetchBooks = async () => {
  loading.value = true
  try {
    const res = await getBooksApi(queryForm)
    books.value = res.data.items
    total.value = res.data.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryForm.page = 1
  fetchBooks()
}

const handleReset = () => {
  queryForm.keyword = ''
  queryForm.category_id = null
  queryForm.available_only = false
  handleSearch()
}

// 借阅操作
const handleBorrow = (book) => {
  ElMessageBox.confirm(
    `您确定要借阅《${book.title}》吗？借阅成功后可在借30天。`,
    '借阅确认',
    {
      confirmButtonText: '确认借阅',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    try {
      const res = await borrowBookApi({ book_id: book.id })
      ElMessage.success(res.message || '借阅成功！')
      fetchBooks()
      userStore.fetchUserInfo()
    } catch (err) {
      console.error(err)
    }
  })
}

// 打开新增
const openCreateDialog = () => {
  isEdit.value = false
  editBookId.value = null
  Object.assign(bookForm, {
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publish_date: '',
    category_id: categories.value[0]?.id || null,
    total_copies: 5,
    location: '1F-A01',
    cover_url: '',
    summary: ''
  })
  dialogVisible.value = true
}

// 打开编辑
const openEditDialog = (book) => {
  isEdit.value = true
  editBookId.value = book.id
  Object.assign(bookForm, {
    isbn: book.isbn,
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    publish_date: book.publish_date,
    category_id: book.category_id,
    total_copies: book.total_copies,
    location: book.location,
    cover_url: book.cover_url,
    summary: book.summary
  })
  dialogVisible.value = true
}

// 提交表单
const submitBookForm = async () => {
  if (!bookFormRef.value) return
  await bookFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateBookApi(editBookId.value, bookForm)
        ElMessage.success('图书信息修改成功')
      } else {
        await createBookApi(bookForm)
        ElMessage.success('新书已成功编目入库！')
      }
      dialogVisible.value = false
      fetchBooks()
    } catch (err) {
      console.error(err)
    } finally {
      submitting.value = false
    }
  })
}

// 删除图书
const handleDelete = (book) => {
  ElMessageBox.confirm(
    `警告：确定要下架注销图书《${book.title}》(ISBN: ${book.isbn}) 吗？`,
    '下架确认',
    {
      confirmButtonText: '确认下架',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteBookApi(book.id)
      ElMessage.success('图书已成功下架')
      fetchBooks()
    } catch (err) {
      console.error(err)
    }
  })
}

onMounted(() => {
  fetchCategories()
  fetchBooks()
  if (route.query.action === 'new' && isLibrarianOrAdmin.value) {
    openCreateDialog()
  }
})
</script>

<style scoped>
.books-container {
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

.book-thumb {
  width: 44px;
  height: 60px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.thumb-error {
  width: 100%;
  height: 100%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.book-title-cell {
  display: flex;
  flex-direction: column;
}

.title-text {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.isbn-text {
  font-size: 12px;
  color: #64748b;
  font-family: monospace;
  margin-top: 2px;
}

.author-cell {
  display: flex;
  flex-direction: column;
  font-size: 13px;
}

.pub-text {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.stock-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stock-label {
  font-size: 13px;
}

.text-green { color: #10b981; }
.text-red { color: #ef4444; }

.pagination-box {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
