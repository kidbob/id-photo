# 证件照 PWA（方案 A）

浏览器本机 AI 抠图 + 换底色 + 规格缩放 + KB 压缩。无需后端、无需快捷指令、照片不上传。

## 功能

- 本机抠图（`@imgly/background-removal`，WASM）
- 白 / 蓝 / 红等底色合成
- 一寸、二寸、签证照等规格
- 上传模式：二分搜索压到 ≤50KB（可改）
- 高清模式：PNG 导出

## 本地开发

```bash
cd D:\cursor-app\id-photo
npm install
npm run icons
npm run dev
```

## 部署 Vercel

1. 将 `id-photo` 目录推送到 GitHub（可单独仓库或子目录）
2. [Vercel](https://vercel.com/) → Import 项目
3. **Root Directory** 设为 `id-photo`（若在 monorepo 内）
4. 无需环境变量
5. Deploy → `https://你的项目.vercel.app`
6. iPhone Safari → 添加到主屏幕

或使用 CLI：

```bash
cd id-photo
npx vercel --prod
```

## 费用

- Vercel 静态托管：个人用量通常免费
- 抠图：0（算力在用户手机）
- 无腾讯云 / OCR 等 API

## 隐私

图片仅在浏览器内存处理；Vercel 仅提供网页与 AI 模型静态文件下载。
