/**
 * 生成可导入的「证件照抠图」快捷指令（.shortcut）
 * 流程：选照片 → 移除背景 → 存入相簿 → 提示打开证件照 App
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

const selectUuid = randomUUID()
const removeUuid = randomUUID()
const saveUuid = randomUUID()
const alertUuid = randomUUID()

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
      WFWorkflowActionIdentifier: 'is.workflow.actions.savetophotoalbum',
      WFWorkflowActionParameters: {
        UUID: saveUuid,
        WFInput: refOutput(removeUuid, 'Image'),
      },
    },
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.alert',
      WFWorkflowActionParameters: {
        UUID: alertUuid,
        WFAlertActionTitle: '抠图完成',
        WFAlertActionMessage:
          '透明底照片已存入相簿。请打开「证件照」应用：关闭「自动抠图」→ 选该照片 → 选底色与尺寸 → 导出。',
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
  WFWorkflowOutputContentItemClasses: [],
  WFWorkflowTypes: [],
  WFWorkflowHasOutputFallback: false,
}

const buffer = bplist(workflow)
const outPath = join(outDir, 'zhengjianzhao-koutu.shortcut')
writeFileSync(outPath, buffer)
console.log(`generated ${outPath} (${buffer.length} bytes)`)
