import { createApp } from 'vue'
import 'vant/lib/index.css'
import './styles/global.css'
import App from './App.vue'
import router from './router'
import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)
app.use(router)
app.mount('#app')

registerSW({
  onNeedRefresh() {
    console.log('有新版本可用，刷新页面即可更新')
  },
})
