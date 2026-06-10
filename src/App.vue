<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const active = computed(() => (route.name === 'help' ? 'help' : 'editor'))

function onChange(name: string | number) {
  router.push(name === 'help' ? '/help' : '/')
}
</script>

<template>
  <div class="app-shell">
    <main class="app-main">
      <router-view />
    </main>
    <van-tabbar v-model="active" @change="onChange" safe-area-inset-bottom>
      <van-tabbar-item name="editor" icon="photo-o">制作</van-tabbar-item>
      <van-tabbar-item name="help" icon="add-o">安装指令</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--bg-color);
}

.app-main {
  min-height: calc(100vh - 50px);
}
</style>
