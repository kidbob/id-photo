/**
 * 生成「证件照抠图」快捷指令
 * 流程：选照片 → 移除背景 → 存储到相簿 → 打开证件照 App（用启动时传入的返回地址）
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import bplist from 'bplist-creator'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/shortcuts')
mkdirSync(outDir, { recursive: true })

function refOutput(uuid, name) {
  return {
    Value: {
      OutputUUID: uuid,
      OutputName: name,
      Type: 'ActionOutput',
    },
    WFSerializationType: 'WFTextTokenAttachment',
  }
}

function refShortcutInput() {
  return {
    Value: {
      Type: 'ExtensionInput',
    },
    WFSerializationType: 'WFTextTokenAttachment',
  }
}

const selectUuid = randomUUID()
const removeUuid = randomUUID()
const saveUuid = randomUUID()

const workflow = {
  WFWorkflowActions: [
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.selectphoto',
      WFWorkflowActionParameters: {
        UUID: selectUuid,
        WFSelectMultiplePhotos: false,
      },
    },
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.imageremovebackground',
      WFWorkflowActionParameters: {
        UUID: removeUuid,
        WFInput: refOutput(selectUuid, 'Photo'),
      },
    },
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.savetocameraroll',
      WFWorkflowActionParameters: {
        UUID: saveUuid,
        WFInput: refOutput(removeUuid, 'Image'),
      },
    },
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.openurl',
      WFWorkflowActionParameters: {
        WFInput: refShortcutInput(),
      },
    },
  ],
  WFWorkflowClientVersion: '2200.0.1',
  WFWorkflowClientRelease: '18.0',
  WFWorkflowMinimumClientVersion: 1113,
  WFWorkflowMinimumClientVersionString: '1113',
  WFWorkflowName: '证件照抠图',
  WFWorkflowIcon: {
    WFWorkflowIconGlyphNumber: 59511,
    WFWorkflowIconStartColor: 463140863,
  },
  WFWorkflowImportQuestions: [],
  WFWorkflowInputContentItemClasses: ['WFStringContentItem', 'WFURLContentItem'],
  WFWorkflowOutputContentItemClasses: [],
  WFWorkflowTypes: [],
  WFWorkflowHasOutputFallback: false,
}

const buffer = bplist(workflow)
const outPath = join(outDir, 'zhengjianzhao-koutu.shortcut')
writeFileSync(outPath, buffer)
console.log(`generated ${outPath} (${buffer.length} bytes)`)
