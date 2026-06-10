<script setup lang="ts">
import { BG_COLORS, PHOTO_SPECS } from '../data/specs'
</script>

<template>
  <div class="page">
    <div class="card">
      <h3 class="section-title">方案 A：纯 PWA（当前）</h3>
      <p class="hint">
        抠图、换底色、缩放、压 KB 全在本机浏览器完成，<strong>无需快捷指令、无需后端</strong>。
        可部署到 Vercel，添加到 iPhone 主屏幕使用。
      </p>
      <ol class="steps">
        <li>选一张半身证件照（背景尽量简单）</li>
        <li>开启「自动抠图换底」→ 选规格与底色</li>
        <li>上传模式：自动压到报名 KB 上限；高清模式：导出 PNG</li>
        <li>长按结果图保存到相簿</li>
      </ol>
    </div>

    <div class="card">
      <h3 class="section-title">内置规格</h3>
      <ul class="steps">
        <li v-for="s in PHOTO_SPECS.filter((x) => x.id !== 'custom')" :key="s.id">
          {{ s.name }}：{{ s.width }}×{{ s.height }} px，默认 ≤{{ s.maxKb }} KB
        </li>
      </ul>
    </div>

    <div class="card">
      <h3 class="section-title">底色</h3>
      <ul class="steps">
        <li v-for="c in BG_COLORS" :key="c.id">{{ c.name }} {{ c.hex }}</li>
      </ul>
    </div>

    <div class="card">
      <h3 class="section-title">费用与隐私</h3>
      <ul class="steps">
        <li>抠图算力在您的 iPhone 上运行，<strong>0 API 费用</strong></li>
        <li>照片不上传服务器（Vercel 只托管网页和模型文件）</li>
        <li>首次使用需从网络加载 AI 模型（约 10MB），之后可缓存</li>
      </ul>
    </div>

    <div class="card">
      <h3 class="section-title">安装到 iPhone</h3>
      <ol class="steps">
        <li>Safari 打开 Vercel 部署地址</li>
        <li>分享 → 添加到主屏幕</li>
        <li>从主屏幕图标打开，全屏使用</li>
      </ol>
    </div>

    <div class="card">
      <h3 class="section-title">可选：快捷指令方案</h3>
      <p class="hint">
        若本机抠图较慢或边缘不满意，仍可用快捷指令抠图后，在本应用中
        <strong>关闭「自动抠图」</strong>，直接导入 PNG 压缩。详见
        <code>docs/shortcut-setup.md</code>。
      </p>
    </div>
  </div>
</template>

<style scoped>
.steps {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
}

code {
  font-size: 12px;
  background: #f0f1f5;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
