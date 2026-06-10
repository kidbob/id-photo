<script setup lang="ts">
import { computed, ref } from 'vue'
import { showLoadingToast, closeToast, showToast } from 'vant'
import { BG_COLORS, PHOTO_SPECS, findSpec } from '../data/specs'
import type { ExportMode } from '../types'
import { formatSize, processIdPhoto } from '../utils/image-process'

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
const removeBackground = ref(true)
const progressText = ref('')
const showSpecPicker = ref(false)
const showBgPicker = ref(false)

const currentSpec = computed(() => findSpec(specId.value))
const isCustom = computed(() => specId.value === 'custom')
const targetWidth = computed(() => (isCustom.value ? customWidth.value : currentSpec.value.width))
const targetHeight = computed(() => (isCustom.value ? customHeight.value : currentSpec.value.height))
const bgHex = computed(() => BG_COLORS.find((c) => c.id === bgColorId.value)?.hex ?? '#FFFFFF')

const specActions = PHOTO_SPECS.map((s) => ({ name: s.name, specId: s.id }))
const bgActions = BG_COLORS.map((c) => ({ name: c.name, bgId: c.id }))

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
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(picked)
  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = ''
  }
  resultInfo.value = ''
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
    <div class="card">
      <h3 class="section-title">选择照片</h3>
      <p class="hint">
        选照片 → 本机 AI 抠图 → 换底色 → 按规格导出。照片仅在手机浏览器内处理，不上传服务器。
        首次抠图需下载模型（约 10MB），请保持网络畅通。
      </p>
      <van-uploader :after-read="onFileRead" accept="image/*" :max-count="1" preview-size="120" />
      <img v-if="previewUrl && !resultUrl" :src="previewUrl" class="preview" alt="原图预览" />
    </div>

    <div class="card">
      <h3 class="section-title">抠图</h3>
      <van-cell title="自动抠图换底" label="关闭则仅缩放/压缩（适用于已抠好的 PNG）">
        <template #right-icon>
          <van-switch v-model="removeBackground" size="20" />
        </template>
      </van-cell>
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
            {{ BG_COLORS.find((c) => c.id === bgColorId)?.name }}
          </span>
        </template>
      </van-field>
      <van-action-sheet
        v-model:show="showBgPicker"
        :actions="bgActions"
        cancel-text="取消"
        close-on-click-action
        @select="onPickBg"
      />
      <p class="hint">抠图后会自动铺所选底色；若关闭抠图且为透明 PNG，也会铺底色。</p>
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
        {{ removeBackground ? '抠图并导出' : '处理并预览' }}
      </van-button>
      <p v-if="processing && progressText" class="hint progress-hint">{{ progressText }}</p>
    </div>

    <div v-if="resultUrl" class="card">
      <h3 class="section-title">导出预览</h3>
      <p class="hint">{{ resultInfo }}</p>
      <img :src="resultUrl" class="preview result" alt="结果预览" />
      <van-button type="primary" block round plain class="mt-12" @click="downloadResult">
        保存到相册 / 下载
      </van-button>
      <p class="hint">iPhone：长按图片 → 存储到照片；或 Safari 分享保存。</p>
    </div>
  </div>
</template>

<style scoped>
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

.mt-12 {
  margin-top: 12px;
}
</style>
