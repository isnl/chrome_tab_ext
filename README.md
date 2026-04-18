# Fresh New Tab

基于 `Vue 3 + <script setup lang="ts"> + TailwindCSS + Vite` 的 Chrome 新标签页扩展。

## 功能

- 顶部 Google 搜索条改为 `sticky` 吸附，不再使用固定 `fixed`
- 天气组件支持 IP 首次定位、手动切换固定城市、本地缓存、小时趋势、多日预报
- 日历组件支持公历、农历、节假日、调休、近期放假安排
- 全部页面逻辑按组件 / composable / service / utils 分层

## 本地开发

```bash
npm install
npm run dev
```

## 构建扩展

```bash
npm run build
```

构建完成后，Chrome 扩展目录使用 `G:\Code\tab_ext\dist`。

## Chrome 加载方式

1. 打开 `chrome://extensions/`
2. 开启右上角“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择目录 `G:\Code\tab_ext\dist`

## 目录结构

- `newtab.html`：Vite 新标签页入口
- `public/manifest.json`：Chrome MV3 manifest
- `src/components/`：搜索、天气、日历组件
- `src/composables/`：状态与业务逻辑
- `src/services/`：接口与存储
- `src/utils/`：日期、天气等工具方法
