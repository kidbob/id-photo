# 证件照 PWA + iPhone 快捷指令

**推荐流程**：快捷指令抠图（快、清晰）→ 本应用铺底色、缩放、压 KB。

## 一键添加快捷指令

1. iPhone **Safari** 打开部署地址
2. 底部 **说明** → **添加快捷指令「证件照抠图」**
3. 设置 → 快捷指令 → 打开 **允许不受信任的快捷指令**

详细图文：[docs/shortcut-setup.md](docs/shortcut-setup.md)

## 证件照 App 使用

1. **制作** 页关闭「浏览器内自动抠图」
2. 选择快捷指令保存的 PNG
3. 选规格、底色 → 上传模式导出

## 本地开发

```bash
cd D:\cursor-app\id-photo
npm install
npm run icons
npm run shortcut
npm run dev
```

## 部署 Vercel

1. GitHub 导入 `id-photo` 目录
2. 无需环境变量
3. Deploy 后 Safari 打开 → 说明页安装快捷指令 → 添加到主屏幕

```bash
npm run vercel-build
```

## 费用

- Vercel 静态托管：个人免费档通常够用
- 快捷指令抠图：0 元（本机）
- 浏览器抠图（可选）：0 元但较慢，默认关闭
