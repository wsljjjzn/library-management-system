<template>
  <div class="categories-container">
    <div class="app-card mb-4 header-action-card">
      <div class="action-left">
        <span class="action-title">馆藏中图法与自定义分类体系维护</span>
      </div>
      <el-button type="success" icon="Plus" @click="openCreate">新建图书分类</el-button>
    </div>

    <div class="app-card table-card">
      <el-table v-loading="loading" :data="categories" stripe style="width: 100%">
        <el-table-column label="排序权重" prop="sort_order" width="100" align="center" />
        <el-table-column label="分类代码" prop="code" width="140">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类名称" prop="name" min-width="180">
          <template #default="{ row }">
            <strong>{{ row.name }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="分类说明与适用学科" prop="description" min-width="240" />
        <el-table-column label="在馆藏书种数" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="row.book_count > 0 ? 'success' : 'info'" size="small">
              {{ row.book_count || 0 }} 种图书
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新建图书分类'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="如 计算机科学与工程" />
        </el-form-item>
        <el-form-item label="分类代码" prop="code">
          <el-input v-model="form.code" placeholder="如 TP312" />
        </el-form-item>
        <el-form-item label="排序权重" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="分类说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="适用专业及涵盖领域..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi } from '@/api'

const loading = ref(false)
const categories = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  name: '',
  code: '',
  sort_order: 1,
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分类代码', trigger: 'blur' }]
}

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await getCategoriesApi()
    categories.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(form, { name: '', code: '', sort_order: 1, description: '' })
  dialogVisible.value = true
}

const openEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    name: row.name,
    code: row.code,
    sort_order: row.sort_order,
    description: row.description
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateCategoryApi(editId.value, form)
        ElMessage.success('分类更新成功')
      } else {
        await createCategoryApi(form)
        ElMessage.success('分类新建成功')
      }
      dialogVisible.value = false
      fetchCategories()
    } catch (err) {
      console.error(err)
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除分类【${row.name}】吗？删除前需确保该分类下无图书关联。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteCategoryApi(row.id)
      ElMessage.success('分类删除成功')
      fetchCategories()
    } catch (err) {
      console.error(err)
    }
  })
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.categories-container {
  display: flex;
  flex-direction: column;
}

.mb-4 {
  margin-bottom: 20px;
}

.header-action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.action-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.table-card {
  padding: 16px 20px;
}
</style>
