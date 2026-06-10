<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showLoadingToast, closeToast, showToast, showDialog } from 'vant'
import { BG_COLORS, PHOTO_SPECS, findBgColor, findSpec } from '../data/specs'
import type { ExportMode, MattingQuality } from '../types'
import { formatSize, processIdPhoto } from '../utils/image-process'
import {
  getShortcutImportUrl,
  hasShortcutInstallHint,
  isLikelyIOS,
  markShortcutInstalled,
  runShortcutFromApp,
} from '../utils/shortcut-install'

const route = useRoute()
const router = useRouter()

const file = ref<File | null>(null)
const previewUrl = ref('')
const resultUrl = ref('')
const specId = ref('1inch')
const bgColorId = ref('white')
const exportMode = ref<ExportMode>('upload')
const maxKb = ref(50)
const customWidth = ref(295)
const customHeight = ref(413)
const resultInfo = ref('')
const processing = ref(false)
const removeBackground = ref(false)
const mattingQuality = ref<MattingQuality>('quality')
const progressText = ref('')
const showSpecPicker = ref(false)
const showBgPicker = ref(false)
const awaitingPhoto = ref(false)
const showAdvanced = ref(false)
const refineHairEdges = ref(true)

const currentSpec = computed(() => findSpec(specId.value))
const isCustom = computed(() => specId.value === 'custom')
const targetWidth = computed(() => (isCustom.value ? customWidth.value : currentSpec.value.width))
const targetHeight = computed(() => (isCustom.value ? customHeight.value : currentSpec.value.height))
const bgHex = computed(() => BG_COLORS.find((c) => c.id === bgColorId.value)?.hex ?? '#FFFFFF')
const onIos = computed(() => isLikelyIOS())

const specActions = PHOTO_SPECS.map((s) => ({ name: s.name, specId: s.id }))
const bgActions = BG_COLORS.map((c) => ({
  name: `${c.name} · RGB ${c.rgb}`,
  bgId: c.id,
}))
const currentBg = computed(() => findBgColor(bgColorId.value))

onMounted(() => {
  if (route.query.fromShortcut === '1') {
    awaitingPhoto.value = true
    showToast({ message: '抠图完成，请选刚存入相簿的照片', duration: 3500 })
    router.replace({ path: route.path, query: {} })
  } else if (onIos.value && !hasShortcutInstallHint()) {
    showDialog({
      title: '首次使用',
      message:
        '请先在「安装指令」页添加快捷指令「证件照抠图」。之后在本页点「开始抠图」即可，完成后会自动跳回。',
      confirmButtonText: '知道了',
    })
  }
})

function onPickSpec(action: { specId?: string }) {
  if (!action.specId) return
  specId.value = action.specId
  const spec = findSpec(action.specId)
  if (action.specId !== 'custom') {
    maxKb.value = spec.maxKb
  }
}

function onPickBg(action: { bgId?: string }) {
  if (!action.bgId) return
  bgColorId.value = action.bgId
}

function onFileRead(item: { file?: File } | { file?: File }[]) {
  const first = Array.isArray(item) ? item[0] : item
  const picked = first?.file
  if (!picked) return
  file.value = picked
  awaitingPhoto.value = false
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(picked)
  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = ''
  }
  resultInfo.value = ''
}

function startMatting() {
  if (!onIos.value) {
    showToast('请在 iPhone Safari 中使用')
    return
  }
  markShortcutInstalled()
  runShortcutFromApp()
}

function goInstallShortcut() {
  if (onIos.value) {
    window.location.href = getShortcutImportUrl()
    markShortcutInstalled()
    return
  }
  showToast('请在 iPhone Safari 打开本应用')
}

async function runExport() {
  if (!file.value) {
    showToast('请先选择照片')
    return
  }
  if (targetWidth.value < 100 || targetHeight.value < 100) {
    showToast('宽高至少 100 像素')
    return
  }

  processing.value = true
  progressText.value = '准备中…'
  showLoadingToast({ message: progressText.value, forbidClick: true, duration: 0 })

  const updateProgress = (message: string) => {
    progressText.value = message
    showLoadingToast({ message, forbidClick: true, duration: 0 })
  }

  try {
    const { blob, quality, sizeKb } = await processIdPhoto({
      file: file.value,
      width: targetWidth.value,
      height: targetHeight.value,
      bgColor: bgHex.value,
      maxKb: maxKb.value,
      mode: exportMode.value,
      removeBackground: removeBackground.value,
      mattingQuality: mattingQuality.value,
      refineHairEdges: refineHairEdges.value,
      onProgress: updateProgress,
    })

    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = URL.createObjectURL(blob)

    const qualityText =
      exportMode.value === 'upload' && quality != null
        ? `质量 ${(quality * 100).toFixed(0)}%`
        : 'PNG 无损'
    const limitText =
      exportMode.value === 'upload' ? ` / 上限 ${maxKb.value} KB` : ''
    const overLimit = exportMode.value === 'upload' && sizeKb > maxKb.value
    resultInfo.value = `${targetWidth.value}×${targetHeight.value} · ${formatSize(sizeKb)} · ${qualityText}${limitText}`

    if (overLimit) {
      showToast('已尽力压缩，仍略超上限，可换更小规格或接受当前文件')
    } else {
      showToast('处理完成')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '处理失败'
    showToast(message)
  } finally {
    closeToast()
    processing.value = false
  }
}

function downloadResult() {
  if (!resultUrl.value) {
    showToast('请先处理照片')
    return
  }
  const ext = exportMode.value === 'hd' ? 'png' : 'jpg'
  const link = document.createElement('a')
  link.href = resultUrl.value
  link.download = `id-photo-${specId.value}.${ext}`
  link.click()
  showToast('已触发下载，也可长按图片保存')
}
</script>

<template>
  <div class="page">
    <div class="card workflow-card">
      <h3 class="section-title">两步完成（不用来回找 App）</h3>
      <p class="hint">
        iOS 不允许把快捷指令嵌在网页里，但可从本页<strong>一键启动</strong>抠图，完成后<strong>自动跳回</strong>这里继续操作。
      </p>

      <div class="step">
        <div class="step-head">
          <span class="step-num">1</span>
          <span class="step-title">抠图（快捷指令）</span>
        </div>
        <p class="hint">跳转到系统抠图 → 选照片 → 存相簿 → 自动回到本页</p>
        <van-button type="primary" block round @click="startMatting">
          开始抠图
        </van-button>
        <van-button plain type="primary" block round class="mt-8" @click="goInstallShortcut">
          尚未安装？添加快捷指令
        </van-button>
      </div>

      <div class="step-divider" />

      <div class="step" :class="{ highlight: awaitingPhoto }">
        <div class="step-head">
          <span class="step-num">2</span>
          <span class="step-title">换底色并压缩（本应用）</span>
        </div>
        <van-notice-bar
          v-if="awaitingPhoto"
          color="#1989fa"
          background="#ecf9ff"
          text="已跳回：请在下方选择刚存入相簿的透明底照片"
        />
        <van-uploader :after-read="onFileRead" accept="image/*" :max-count="1" preview-size="120" />
        <img v-if="previewUrl && !resultUrl" :src="previewUrl" class="preview" alt="原图预览" />
      </div>
    </div>

    <div class="card">
      <h3 class="section-title">规格与底色</h3>
      <van-field label="规格" is-link readonly @click="showSpecPicker = true">
        <template #input>
          <span>{{ currentSpec.name }}</span>
        </template>
      </van-field>
      <van-action-sheet
        v-model:show="showSpecPicker"
        :actions="specActions"
        cancel-text="取消"
        close-on-click-action
        @select="onPickSpec"
      />

      <template v-if="isCustom">
        <van-field v-model.number="customWidth" type="digit" label="宽度 px" />
        <van-field v-model.number="customHeight" type="digit" label="高度 px" />
      </template>
      <p v-else class="hint spec-note">{{ currentSpec.note }} · {{ currentSpec.width }}×{{ currentSpec.height }} px</p>

      <van-field label="底色" is-link readonly @click="showBgPicker = true">
        <template #input>
          <span class="bg-preview">
            <i class="bg-dot" :style="{ background: bgHex }" />
            {{ currentBg.name }}
          </span>
        </template>
      </van-field>
      <p class="hint spec-note">RGB {{ currentBg.rgb }}（{{ currentBg.hex }}）· {{ currentBg.note }}</p>
      <van-action-sheet
        v-model:show="showBgPicker"
        :actions="bgActions"
        cancel-text="取消"
        close-on-click-action
        @select="onPickBg"
      />
      <van-cell
        title="优化黑发边缘"
        label="填补刘海空隙、去除白/蓝边毛刺（深色头发推荐开启）"
      >
        <template #right-icon>
          <van-switch v-model="refineHairEdges" size="20" />
        </template>
      </van-cell>
    </div>

    <div class="card">
      <h3 class="section-title">导出模式</h3>
      <van-radio-group v-model="exportMode" direction="horizontal" class="mode-group">
        <van-radio name="upload">上传模式（压到 KB 上限）</van-radio>
        <van-radio name="hd">高清模式（PNG）</van-radio>
      </van-radio-group>
      <van-field
        v-if="exportMode === 'upload'"
        v-model.number="maxKb"
        type="digit"
        label="大小上限"
      >
        <template #button>KB</template>
      </van-field>
    </div>

    <div class="card actions">
      <van-button type="primary" block round :loading="processing" @click="runExport">
        处理并导出
      </van-button>
      <p v-if="processing && progressText" class="hint progress-hint">{{ progressText }}</p>
    </div>

    <div class="card">
      <van-cell
        title="高级：浏览器内抠图（较慢）"
        :value="showAdvanced ? '收起' : '展开'"
        is-link
        @click="showAdvanced = !showAdvanced"
      />
      <template v-if="showAdvanced">
        <van-cell title="开启浏览器抠图">
          <template #right-icon>
            <van-switch v-model="removeBackground" size="20" />
          </template>
        </van-cell>
        <van-radio-group
          v-if="removeBackground"
          v-model="mattingQuality"
          direction="horizontal"
          class="mode-group"
        >
          <van-radio name="quality">精细</van-radio>
          <van-radio name="fast">快速</van-radio>
        </van-radio-group>
      </template>
    </div>

    <div v-if="resultUrl" class="card">
      <h3 class="section-title">导出预览</h3>
      <p class="hint">{{ resultInfo }}</p>
      <img :src="resultUrl" class="preview result" alt="结果预览" />
      <van-button type="primary" block round plain class="mt-12" @click="downloadResult">
        保存到相册 / 下载
      </van-button>
      <p class="hint">iPhone：长按图片 → 存储到照片</p>
    </div>
  </div>
</template>

<style scoped>
.workflow-card {
  border: 1px solid #c5d4ff;
  background: #f8faff;
}

.step-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent, #4a6cf7);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-title {
  font-size: 15px;
  font-weight: 600;
}

.step.highlight {
  padding: 12px;
  margin: 0 -12px;
  border-radius: 8px;
  background: #ecf9ff;
}

.step-divider {
  height: 1px;
  background: #e5e8f0;
  margin: 16px 0;
}

.preview {
  display: block;
  max-width: 100%;
  margin-top: 12px;
  border-radius: 8px;
  border: 1px solid #eee;
}

.preview.result {
  max-height: 360px;
  object-fit: contain;
  margin-left: auto;
  margin-right: auto;
}

.spec-note {
  margin-top: -4px;
}

.bg-preview {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.bg-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #ddd;
  display: inline-block;
}

.mode-group {
  gap: 12px;
  margin-bottom: 12px;
}

.actions {
  padding-top: 8px;
  padding-bottom: 8px;
}

.progress-hint {
  margin-top: 10px;
  margin-bottom: 0;
  text-align: center;
}

.mt-8 {
  margin-top: 8px;
}

.mt-12 {
  margin-top: 12px;
}
</style>
