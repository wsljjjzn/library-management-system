<template>
  <div class="dashboard-container">
    <!-- 读者资信告警条 (仅当读者且有超期或达到上限时提示) -->
    <el-alert
      v-if="userInfo?.role === 'reader' && userInfo?.has_overdue"
      title="【重要借阅阻断提醒】您的名下存在逾期未归还的图书！系统已暂停借阅权限，请尽快在“我的借阅档案”中归还并结清滞纳金。"
      type="error"
      show-icon
      class="mb-4"
    />

    <!-- 顶部核心指标卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="12" :sm="6" :md="6">
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">馆藏图书种数</span>
            <span class="stat-value">{{ overview.total_titles || 0 }}</span>
            <span class="stat-hint">共计 {{ overview.total_volumes || 0 }} 册实体图书</span>
          </div>
          <div class="stat-icon icon-blue">
            <el-icon size="24"><Reading /></el-icon>
          </div>
        </div>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6">
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">在架可借册数</span>
            <span class="stat-value text-green">{{ overview.available_volumes || 0 }}</span>
            <span class="stat-hint">当前读者可即刻借阅</span>
          </div>
          <div class="stat-icon icon-green">
            <el-icon size="24"><CircleCheck /></el-icon>
          </div>
        </div>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6">
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">当前在借流通</span>
            <span class="stat-value text-orange">{{ overview.active_borrows || 0 }}</span>
            <span class="stat-hint">累计借还 {{ overview.total_circulations || 0 }} 次</span>
          </div>
          <div class="stat-icon icon-orange">
            <el-icon size="24"><Tickets /></el-icon>
          </div>
        </div>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6">
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">超期逾期警示</span>
            <span class="stat-value" :class="overview.overdue_borrows > 0 ? 'text-red' : 'text-slate'">
              {{ overview.overdue_borrows || 0 }}
            </span>
            <span class="stat-hint">已超出约定借阅时限</span>
          </div>
          <div class="stat-icon icon-red">
            <el-icon size="24"><Warning /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表展示区：借还趋势 & 热门借阅榜单 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :lg="16">
        <div class="app-card chart-card">
          <div class="card-header">
            <span class="card-title">近 7 天借还流通趋势</span>
            <el-tag size="small" type="primary">实时流转</el-tag>
          </div>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </el-col>

      <el-col :xs="24" :lg="8">
        <div class="app-card chart-card">
          <div class="card-header">
            <span class="card-title">读者热门借阅榜 Top 8</span>
            <el-button link type="primary" size="small" @click="$router.push('/books')">查看全部</el-button>
          </div>
          <div class="rank-list">
            <div 
              v-for="(item, index) in trends.popular_books" 
              :key="item.id" 
              class="rank-item"
            >
              <span class="rank-badge" :class="'badge-' + (index + 1)">{{ index + 1 }}</span>
              <div class="rank-info">
                <span class="book-name" :title="item.title">{{ item.title }}</span>
                <span class="book-author">{{ item.author }}</span>
              </div>
              <span class="rank-count">{{ item.times }} 次</span>
            </div>
            <el-empty v-if="!trends.popular_books?.length" description="暂无借阅记录" :image-size="60" />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 底部功能快捷通道 -->
    <div class="app-card quick-actions-card">
      <div class="card-header">
        <span class="card-title">快捷业务导航</span>
      </div>
      <el-row :gutter="12">
        <el-col :xs="12" :sm="6">
          <div class="action-btn-box" @click="$router.push('/books')">
            <el-icon size="24" color="#3b82f6"><Search /></el-icon>
            <div class="action-text">
              <strong>检索馆藏</strong>
              <span>多条件书目检索与借阅</span>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="action-btn-box" @click="$router.push('/my-borrows')">
            <el-icon size="24" color="#10b981"><Clock /></el-icon>
            <div class="action-text">
              <strong>我的在借</strong>
              <span>在线快速还书与续借</span>
            </div>
          </div>
        </el-col>
        <el-col v-if="isLibrarianOrAdmin" :xs="12" :sm="6">
          <div class="action-btn-box" @click="$router.push('/borrows')">
            <el-icon size="24" color="#f59e0b"><Operation /></el-icon>
            <div class="action-text">
              <strong>全馆借还</strong>
              <span>出入库核验与逾期催缴</span>
            </div>
          </div>
        </el-col>
        <el-col v-if="isLibrarianOrAdmin" :xs="12" :sm="6">
          <div class="action-btn-box" @click="$router.push('/books?action=new')">
            <el-icon size="24" color="#8b5cf6"><FolderAdd /></el-icon>
            <div class="action-text">
              <strong>新书入库</strong>
              <span>标准 ISBN 编目采编</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { getStatsOverviewApi, getStatsTrendsApi } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const isLibrarianOrAdmin = computed(() => userStore.isLibrarianOrAdmin)

const overview = ref({})
const trends = ref({ dates: [], borrow_counts: [], return_counts: [], popular_books: [] })
const trendChartRef = ref(null)
let chartInstance = null

const initChart = () => {
  if (!trendChartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(trendChartRef.value)
  }

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['借出数量', '归还入库'], top: '0%' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trends.value.dates || []
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '借出数量',
        type: 'line',
        smooth: true,
        data: trends.value.borrow_counts || [],
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
          ])
        }
      },
      {
        name: '归还入库',
        type: 'line',
        smooth: true,
        data: trends.value.return_counts || [],
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
          ])
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(async () => {
  try {
    const [overviewRes, trendsRes] = await Promise.all([
      getStatsOverviewApi(),
      getStatsTrendsApi()
    ])
    overview.value = overviewRes.data
    trends.value = trendsRes.data
    await nextTick()
    initChart()
    window.addEventListener('resize', handleResize)
  } catch (err) {
    console.error('获取看板数据失败', err)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
  }
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
}

.mb-4 {
  margin-bottom: 20px;
}

.stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.stat-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.text-green { color: #10b981; }
.text-orange { color: #f59e0b; }
.text-red { color: #ef4444; }
.text-slate { color: #64748b; }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-blue { background: #eff6ff; color: #3b82f6; }
.icon-green { background: #ecfdf5; color: #10b981; }
.icon-orange { background: #fffbeb; color: #f59e0b; }
.icon-red { background: #fef2f2; color: #ef4444; }

.chart-card {
  min-height: 380px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  transition: background 0.2s;
}

.rank-item:hover {
  background: #f8fafc;
}

.rank-badge {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.badge-1 { background: #fee2e2; color: #dc2626; }
.badge-2 { background: #ffedd5; color: #ea580c; }
.badge-3 { background: #fef3c7; color: #d97706; }

.rank-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.book-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.rank-count {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
}

.quick-actions-card {
  padding: 20px;
}

.action-btn-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn-box:hover {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.action-text {
  display: flex;
  flex-direction: column;
}

.action-text strong {
  font-size: 14px;
  color: #1e293b;
}

.action-text span {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
</style>
