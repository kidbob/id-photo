<script setup lang="ts">
import { computed } from 'vue'
import { showToast } from 'vant'
import { BG_COLORS, PHOTO_SPECS } from '../data/specs'
import {
  getShortcutFileUrl,
  getShortcutImportUrl,
  isLikelyIOS,
} from '../utils/shortcut-install'

const importUrl = computed(() => getShortcutImportUrl())
const fileUrl = computed(() => getShortcutFileUrl())
const onIos = computed(() => isLikelyIOS())

function installShortcut() {
  window.location.href = importUrl.value
}

function copyLink() {
  navigator.clipboard?.writeText(importUrl.value).then(
    () => showToast('已复制，请在 iPhone Safari 粘贴打开'),
    () => showToast('请手动复制下方链接'),
  )
}
</script>

<template>
  <div class="page">
    <div class="card highlight">
      <h3 class="section-title">一键添加快捷指令</h3>
      <p class="hint">
        与网上分享的快捷指令一样：在 iPhone 上点按钮 → 跳转到「快捷指令」→ 点「添加快捷指令」即可。
        需 iOS 16 及以上。
      </p>
      <van-button v-if="onIos" type="primary" block round size="large" @click="installShortcut">
        添加快捷指令「证件照抠图」
      </van-button>
      <template v-else>
        <p class="hint">请在 <strong>iPhone 的 Safari</strong> 打开本页面，再点下方按钮。</p>
        <van-button type="primary" block round plain @click="copyLink">复制安装链接</van-button>
      </template>
      <p class="hint link-hint">
        若按钮无效，在 Safari 地址栏粘贴：<br />
        <code class="break">{{ importUrl }}</code>
      </p>
      <p class="hint">
        快捷指令文件直链：<code>{{ fileUrl }}</code>
      </p>
    </div>

    <div class="card">
      <h3 class="section-title">第一次使用前（必看）</h3>
      <ol class="steps">
        <li>打开 iPhone <strong>设置</strong></li>
        <li>进入 <strong>快捷指令</strong></li>
        <li>打开 <strong>允许不受信任的快捷指令</strong>（若没有此项，先随便运行一次快捷指令再回来看）</li>
        <li>若提示需要先在 App 内运行快捷指令，可先完成下方「手动添加」第 1 步再回来打开</li>
      </ol>
    </div>

    <div class="card">
      <h3 class="section-title">为什么不能嵌在应用里？</h3>
      <p class="hint">
        苹果规定：<strong>移除背景</strong>只能由系统「快捷指令」或原生 App 调用，网页/PWA 不能直接嵌入该界面。
        折中办法：在本应用点 <strong>开始抠图</strong> → 系统抠完 → <strong>自动跳回</strong>本应用继续，无需自己去找快捷指令 App。
      </p>
    </div>

    <div class="card">
      <h3 class="section-title">推荐流程（全程从本应用出发）</h3>
      <ol class="steps">
        <li><strong>制作</strong> 页 → 点 <strong>开始抠图</strong></li>
        <li>在快捷指令里选照片，等待抠图保存（会自动回到证件照 App）</li>
        <li>在步骤 2 选刚存入相簿的照片 → 选规格底色 → <strong>处理并导出</strong></li>
      </ol>
    </div>

    <div class="card">
      <h3 class="section-title">手动创建（链接失败时）</h3>
      <p class="hint">零基础可按 <code>docs/shortcut-setup.md</code> 在 App 里自己搭，约 10 分钟。</p>
      <ol class="steps">
        <li>打开「快捷指令」→ 右上角 <strong>＋</strong></li>
        <li>添加「选取照片」→ 关闭「选择多张」</li>
        <li>添加「移除图像背景」→ 输入选「照片」</li>
        <li>添加「存储到相簿」→ 输入选上一步图像</li>
        <li>添加「显示提醒」：抠图完成，请打开证件照 App 压缩</li>
        <li>右上角「完成」，命名「证件照抠图」</li>
      </ol>
      <p class="hint">更详细图文步骤见项目文档 shortcut-setup.md。</p>
    </div>

    <div class="card">
      <h3 class="section-title">规格与底色（在证件照 App 里选）</h3>
      <ul class="steps">
        <li v-for="s in PHOTO_SPECS.filter((x) => x.id !== 'custom')" :key="s.id">
          {{ s.name }}：{{ s.width }}×{{ s.height }} px，默认 ≤{{ s.maxKb }} KB
        </li>
      </ul>
      <ul class="steps">
        <li v-for="c in BG_COLORS" :key="c.id">
          {{ c.name }}：{{ c.hex }} · RGB({{ c.rgb }}) — {{ c.note }}
        </li>
      </ul>
      <p class="hint">
        国内没有唯一国标色，最常见的是蓝 <code>#438EDB</code> 与浅蓝 <code>#00BFF3</code> 两套。
        报名页若写了 RGB，请选一致的那一项。
      </p>
    </div>

    <div class="card">
      <h3 class="section-title">常见问题</h3>
      <ul class="steps">
        <li><strong>点添加没反应</strong>：必须用 Safari；检查「允许不受信任的快捷指令」</li>
        <li><strong>提示无法导入</strong>：改用手动创建；或升级 iOS / 快捷指令 App</li>
        <li><strong>抠图失败</strong>：换背景简单、人脸清晰的照片</li>
        <li><strong>衣服还有杂色</strong>：在证件照 App 关闭自动抠图，只处理快捷指令输出的 PNG</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.highlight {
  border: 1px solid #c5d4ff;
  background: #f8faff;
}

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
  word-break: break-all;
}

code.break {
  display: block;
  margin-top: 8px;
  padding: 8px;
  line-height: 1.5;
}

.link-hint {
  margin-top: 12px;
}
</style>
