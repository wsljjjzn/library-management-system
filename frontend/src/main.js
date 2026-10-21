import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// 按需精准导入业务用到的 Element Plus 图标
import {
  Reading,
  Odometer,
  Tickets,
  List,
  CollectionTag,
  UserFilled,
  Fold,
  Expand,
  Postcard,
  ArrowDown,
  User,
  SwitchButton,
  CircleCheck,
  Warning,
  Search,
  Clock,
  Operation,
  FolderAdd,
  Picture,
  Plus,
  Refresh,
  Lock,
  Message,
  Iphone
} from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

const icons = {
  Reading,
  Odometer,
  Tickets,
  List,
  CollectionTag,
  UserFilled,
  Fold,
  Expand,
  Postcard,
  ArrowDown,
  User,
  SwitchButton,
  CircleCheck,
  Warning,
  Search,
  Clock,
  Operation,
  FolderAdd,
  Picture,
  Plus,
  Refresh,
  Lock,
  Message,
  Iphone
}

for (const [key, component] of Object.entries(icons)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 确保路由准备完毕后再挂载到 DOM，杜绝白屏
router.isReady().then(() => {
  app.mount('#app')
})
