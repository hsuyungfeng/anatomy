# 醫療結構化病歷輸入系統 - 實現文檔

## 📋 專案概述

**醫療結構化病歷輸入系統** 是一個完整的 Web 應用，用於通過圖像標註和結構化表單記錄患者的解剖位置疾病信息。系統支持多個解剖系統（牙齒、眼睛、身體）、多語言界面（繁體中文/英文）和完整的數據持久化。

### 核心特性
- ✅ **圖像互動標註**：點擊圖像即時記錄位置
- ✅ **多解剖系統**：牙齒、眼睛、身體
- ✅ **結構化表單**：分類疾病選擇、嚴重程度、備註
- ✅ **雙語支持**：繁體中文 + 英文實時切換
- ✅ **本地存儲**：localStorage 永久保存數據
- ✅ **導出功能**：JSON 和文本格式匯出
- ✅ **響應式設計**：桌面、平板、手機完全適配
- ✅ **性能優化**：requestAnimationFrame、節流、防抖

## 📁 檔案結構

```
anatomy/
├── index.html                              # 主應用入口
├── pages/
│   └── medical-record.html                 # 詳細病歷編輯頁
├── assets/
│   ├── images/
│   │   ├── teeth/                          # 牙齒圖像目錄
│   │   ├── eye/                            # 眼睛圖像目錄
│   │   └── body/                           # 身體圖像目錄
│   ├── scripts/
│   │   ├── utils.js                        # 工具函數庫（400+ 行）
│   │   ├── image-annotator.js              # 圖像標註模組（400+ 行）
│   │   ├── disease-form.js                 # 疾病表單模組（320+ 行）
│   │   ├── ocr-handler.js                  # OCR 整合（150+ 行）
│   │   ├── record-manager.js               # 病歷管理（350+ 行）
│   │   └── main.js                         # 應用控制器（550+ 行）
│   └── styles/
│       ├── main.css                        # 主樣式框架（890+ 行）
│       ├── annotator.css                   # 標註器樣式（280+ 行）
│       └── modal.css                       # 模態窗口樣式（420+ 行）
├── data/
│   ├── anatomical-systems.json             # 解剖系統配置
│   ├── tooth-numbering.json                # 牙齒編號系統
│   └── disease-categories.json             # 疾病分類資料（可選）
├── docs/
│   └── (文檔資料夾)
├── openspec/
│   ├── project.md                          # 專案配置
│   └── AGENTS.md                           # AI 代理指引
└── IMPLEMENTATION.md                       # 本文檔
```

## 🏗️ 架構設計

### 分層架構

```
┌─────────────────────────────────────────┐
│        User Interface Layer             │
│   (HTML/CSS - 響應式設計)                  │
├─────────────────────────────────────────┤
│    Application Controller (main.js)     │
│  - 模組初始化和協調                      │
│  - 事件路由                              │
│  - 狀態管理                              │
├──┬──────────────┬──────────┬───────────┤
│  │              │          │           │
│  │              │          │           │
│  ▼              ▼          ▼           ▼
│Image          Disease    Record      OCR
│Annotator      Form       Manager     Handler
│(Canvas)       (Modal)    (Storage)   (Tesseract)
│
│              Utility Layer (utils.js)
│  DOM, Events, Storage, Language, Notifications
└─────────────────────────────────────────┘
```

### 模組互動流程

```
用戶點擊圖像
    ↓
ImageAnnotator.handleImageClick()
    ↓ 分派事件
annotation:click
    ↓
MedicalRecordApp.handleAnnotationClick()
    ↓
openDiseaseModal(position)
    ↓
初始化/顯示 DiseaseForm
    ↓
用戶填充表單並保存
    ↓
saveDiseaseAnnotation()
    ↓
   ├→ DiseaseForm.getFormData()
   ├→ RecordManager.addAnnotation()
   ├→ ImageAnnotator.addAnnotation()
   └→ updateRecordList()
    ↓
通知保存成功
```

## 🎯 核心功能詳解

### 1. 圖像標註模組 (ImageAnnotator)

**檔案**: `assets/scripts/image-annotator.js` (400+ 行)

#### 主要功能
- Canvas 圖像渲染與管理
- 縮放和平移控制
- 點擊位置記錄
- 標註視覺化

#### 關鍵方法

```javascript
// 加載圖像
async loadImage(imagePath)
  ↳ 異步加載圖像，支持失敗重試

// 渲染圖像（性能優化）
renderImage()
  ↳ 使用 requestAnimationFrame 進行高效渲染
  ↳ 動態調整 Canvas 尺寸

// 縮放控制
handleZoom(event)        // 滾輪縮放（0.5-4x）
zoomIn() / zoomOut()     // 按鈕控制
resetZoom()              // 重置為 100%

// 標註管理
addAnnotation(annotation)    // 添加標記
removeAnnotation(id)         // 移除標記
clearAnnotations()           // 清除全部
```

#### 性能優化

```javascript
// 1. requestAnimationFrame 優化
if (this.renderFrame) {
  cancelAnimationFrame(this.renderFrame);
}
this.renderFrame = requestAnimationFrame(() => {
  this._performRender();
});

// 2. mousemove 事件節流
addEventListener('mousemove',
  throttle((e) => this.handleMouseMove(e), 16)  // 60fps
);

// 3. Canvas 尺寸條件更新
if (canvas.width !== newWidth || canvas.height !== newHeight) {
  canvas.width = newWidth;  // 只在必要時更新
}
```

### 2. 疾病表單模組 (DiseaseForm)

**檔案**: `assets/scripts/disease-form.js` (320+ 行)

#### 主要功能
- 動態生成分層疾病列表
- 實時搜尋/篩選
- 嚴重程度選擇
- 備註輸入
- 多語言支持

#### 資料結構

```javascript
// 表單數據
{
  diseases: [
    { id: "caries", name: "齲齒", nameEn: "Dental Caries" },
    { id: "periodontal", name: "牙周病", nameEn: "Periodontal Disease" }
  ],
  severity: "moderate",      // mild | moderate | severe
  notes: "近端面齲齒"
}
```

#### 關鍵方法

```javascript
// 渲染表單
render()
  ↳ 生成動態 HTML
  ↳ 設置事件監聽

// 搜尋功能（防抖優化）
filterDiseases(searchTerm)
  ↳ 實時篩選顯示/隱藏項目

// 表單數據管理
getFormData()                     // 收集用戶輸入
setFormData(data)                 // 預填表單
reset()                           // 清空表單

// 多語言支持
updateLanguageDisplay()
  ↳ 切換嚴重程度標籤語言
  ↳ 更新佔位符文本
```

#### 效能最佳化

```javascript
// 防抖搜尋輸入
addEventListener('input', debounce((e) => {
  this.filterDiseases(e.target.value);
}, 150));  // 150ms 防抖延遲

// 防抖備註輸入
addEventListener('input', debounce((e) => {
  this.notes = e.target.value;
}, 300));  // 300ms 防抖延遲
```

### 3. 病歷管理模組 (RecordManager)

**檔案**: `assets/scripts/record-manager.js` (350+ 行)

#### 主要功能
- 完整的 CRUD 操作
- localStorage 持久化
- 數據導出（JSON/Text）
- 統計信息

#### 資料結構

```javascript
// 病歷記錄
{
  recordId: "uuid",
  patientId: "patient-123",
  createdAt: "2025-12-16T10:30:00Z",
  updatedAt: "2025-12-16T10:35:00Z",
  anatomicalSystems: [
    {
      systemId: "teeth",
      systemName: "牙齒系統",
      imageId: "allteeth",
      annotations: [
        {
          annotationId: "uuid",
          position: { x: 150, y: 200 },
          locationName: "牙齒位置: 左上門牙",
          diseases: [
            {
              id: "caries",
              name: "齲齒",
              nameEn: "Dental Caries",
              severity: "moderate",
              notes: "近端面齲齒"
            }
          ],
          createdAt: "2025-12-16T10:30:00Z"
        }
      ]
    }
  ],
  notes: "患者備註"
}
```

#### 關鍵方法

```javascript
// 記錄管理
createRecord(recordData)                    // 新建記錄
getCurrentRecord()                          // 獲取當前記錄
deleteRecord(recordId)                      // 刪除記錄

// 標註操作
addAnnotation(systemId, annotation)         // 添加標註
updateAnnotation(systemId, annoId, updates) // 更新標註
deleteAnnotation(systemId, annoId)          // 刪除標註
getAnnotationsBySystem(systemId)            // 按系統篩選

// 數據導出
exportAsJSON(recordId)                      // JSON 格式
exportAsText(recordId)                      // 人類可讀格式
downloadRecord(format, recordId)            // 觸發下載

// 統計信息
getStatistics()                             // 返回統計數據
```

### 4. 應用控制器 (MedicalRecordApp)

**檔案**: `assets/scripts/main.js` (550+ 行)

#### 主要職責
- 模組初始化和協調
- 解剖系統切換
- 事件路由
- 位置推斷算法

#### 關鍵方法

```javascript
// 應用生命週期
async init()                          // 初始化應用
async loadData()                      // 加載配置數據
initModules()                         // 初始化各模組
setupEventListeners()                 // 設置事件監聽

// 系統管理
async loadSystemImage(systemId)       // 切換解剖系統
loadAnnotations(systemId)             // 加載當前系統標註

// 模態窗口管理
openDiseaseModal(position)            // 打開疾病錄入
closeDiseaseModal()                   // 關閉模態
saveDiseaseAnnotation()               // 保存標註

// 位置推斷（基於座標）
getLocationName(position)              // 獲取可讀位置名稱
estimateToothLocation(position)        // 牙齒位置推斷
estimateEyeLocation(position)          // 眼睛位置推斷
estimateBodyLocation(position)         // 身體位置推斷
```

#### 位置推斷算法

**牙齒系統** (32 顆牙齒)
- X 軸分割：磨牙 < 臼牙 < 犬牙 < 門牙
- Y 軸分割：上牙 | 中線 | 下牙
- 結果：「左上門牙」、「右下臼牙」等

**眼睛系統**
- X 軸分割：左眼 | 中央 | 右眼
- Y 軸分割：上瞼 | 虹膜 | 下瞼
- 邊角檢測：內眼角、外眼角
- 結果：「左眼角膜」、「右眼上瞼」等

**身體系統**
- Y 軸分割：頭部 → 頸肩 → 胸腔 → 腹部 → 下肢
- X 軸分割：左側 → 中央 → 右側
- 結果：「左胸」、「上腹」、「左腿」等

## 🎨 樣式系統

### CSS 變數架構 (在 main.css 中定義)

```css
:root {
  /* 顏色方案 */
  --color-primary: #0066cc;
  --color-teeth: #ffd700;      /* 金黃色 */
  --color-eye: #87ceeb;        /* 天藍色 */
  --color-body: #ff6b9d;       /* 粉紅色 */

  /* 響應式斷點 */
  --breakpoint-mobile: 480px;
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;

  /* 排版 */
  --font-size-base: 14px;
  --font-weight-medium: 500;

  /* 過渡動畫 */
  --transition-fast: 150ms;
  --transition-base: 300ms;
}
```

### 響應式設計斷點

| 設備 | 寬度 | 佈局 | 調整 |
|------|------|------|------|
| 手機 | < 480px | 單欄堆疊 | 隱藏標籤文字、簡化控制 |
| 平板 | 480-1023px | 縱向堆疊 | 調整字體、控制大小 |
| 桌面 | ≥ 1024px | 橫向分割 | 完整功能、優化佈局 |

**手機優化** (480px 以下)
- 模態窗口從下方滑上 (bottom sheet 風格)
- 隱藏標籤文字，僅顯示圖標
- 全寬按鈕堆疊
- 縮小字體和間距

**桌面優化** (1024px 以上)
- 圖像區域占 2/3 寬度
- 病歷列表固定 350px 寬度
- 完整工具欄和菜單

## 🌍 多語言系統

### 實現方式

#### HTML 標記
```html
<h1 data-en="Medical Record System">
  醫療結構化病歷輸入系統
</h1>
```

#### 語言切換流程
```javascript
// 用戶點擊語言按鈕
user clicks language button
    ↓
switchLanguage(lang)
    ↓
setLanguage(lang)  // 保存到 localStorage
updateLanguageUI(lang)  // 更新所有 UI 文本
dispatchEvent('language:changed')
    ↓
所有模組監聽事件並更新
```

#### 支持的語言
- 繁體中文 (`zh`): 預設語言
- 英文 (`en`): 完整翻譯

#### 多語言覆蓋範圍
- ✅ 主界面所有標籤和按鈕
- ✅ 模態窗口標題和按鈕
- ✅ 表單標籤和佔位符
- ✅ 通知訊息
- ✅ 系統標籤名稱

## 📊 數據流圖

### 完整的標註流程

```
┌─────────────────────────────────────────────────────────┐
│ 用戶開啟應用                                             │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 1. 加載數據與初始化                                      │
│    ├─ loadData() → 加載解剖系統配置                      │
│    ├─ initModules() → 初始化各模組                       │
│    └─ loadSystemImage('teeth') → 顯示牙齒圖像           │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 2. 用戶交互                                              │
│    ├─ 切換解剖系統 → loadSystemImage()                  │
│    ├─ 點擊圖像位置 → 標記座標                            │
│    └─ 填充疾病表單 → 選擇疾病、嚴重程度                 │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 3. 圖像標註流程 (ImageAnnotator)                        │
│                                                         │
│  user click on image                                   │
│        ↓                                                │
│  handleImageClick(event)                               │
│        ↓                                                │
│  calculate position from click coordinates              │
│        ↓                                                │
│  dispatch 'annotation:click' event with position        │
│        ↓                                                │
│  MedicalRecordApp captures event                        │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 4. 模態窗口與表單 (DiseaseForm)                         │
│                                                         │
│  openDiseaseModal(position)                             │
│        ↓                                                │
│  show modal with location info                          │
│        ↓                                                │
│  initialize / render DiseaseForm                        │
│        ↓                                                │
│  user selects diseases & severity                       │
│        ↓                                                │
│  user clicks 'Save'                                     │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 5. 數據保存 (RecordManager)                             │
│                                                         │
│  saveDiseaseAnnotation()                                │
│        ↓                                                │
│  collect form data: getFormData()                       │
│        ↓                                                │
│  build annotation object with position & diseases       │
│        ↓                                                │
│  recordManager.addAnnotation(systemId, annotation)      │
│        ↓                                                │
│  save to localStorage                                   │
│        ↓                                                │
│  dispatch 'annotation:added' event                      │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 6. 視覺更新                                              │
│                                                         │
│  annotator.addAnnotation() → 在圖像上繪製圓點           │
│  updateRecordList(systemId) → 更新右側列表              │
│  showNotification('疾病記錄已保存') → 顯示成功提示       │
└─────────────────────────────────────────────────────────┘
```

## ⚡ 性能最佳化

### 1. 渲染優化

```javascript
// 使用 requestAnimationFrame 合併多次重繪
this.renderFrame = requestAnimationFrame(() => {
  this._performRender();
});

// 避免重複的 Canvas 尺寸更新
if (canvas.width !== newWidth) {
  canvas.width = newWidth;  // 只在尺寸變化時更新
}
```

### 2. 事件優化

```javascript
// mousemove 事件節流 (60fps)
addEventListener('mousemove',
  throttle((e) => this.handleMouseMove(e), 16)
);

// 搜尋輸入防抖 (150ms)
addEventListener('input',
  debounce((e) => this.filterDiseases(e.target.value), 150)
);
```

### 3. DOM 查詢優化

```javascript
// 使用單一的 querySelector (快速)
const element = $('#selector');

// 避免重複查詢相同元素
const input = $('#disease-search');
// 之後重複使用 input 而不是重新查詢
```

### 4. 動畫優化

```css
/* 使用 transform 和 opacity (GPU 加速) */
transition: transform 0.3s ease, opacity 0.3s ease;

/* 避免重排的屬性變更 */
/* ✅ 好 */
element.style.transform = 'translateX(10px)';

/* ❌ 不好 */
element.style.left = '10px';  /* 導致重排 */
```

## 🧪 測試清單

### 功能測試

- [ ] **圖像加載**
  - [ ] 正確加載各系統圖像
  - [ ] 圖像加載失敗時顯示錯誤
  - [ ] 多次切換系統不出現重複加載

- [ ] **標註功能**
  - [ ] 點擊圖像開啟模態窗口
  - [ ] 顯示正確的位置信息
  - [ ] 可以多次標註同一區域

- [ ] **表單操作**
  - [ ] 疾病選擇正確保存
  - [ ] 搜尋功能正確篩選
  - [ ] 嚴重程度選擇可用
  - [ ] 備註文本可輸入

- [ ] **數據持久化**
  - [ ] 刷新頁面後數據保留
  - [ ] 多個記錄不衝突
  - [ ] 清空功能正確執行

- [ ] **導出功能**
  - [ ] JSON 導出格式正確
  - [ ] 文本導出可讀
  - [ ] 文件下載正確命名

### 響應式測試

- [ ] **手機** (< 480px)
  - [ ] 模態從下方滑出
  - [ ] 標籤文字隱藏
  - [ ] 按鈕堆疊排列

- [ ] **平板** (480-1023px)
  - [ ] 佈局垂直堆疊
  - [ ] 控制適當縮小
  - [ ] 操作便利性

- [ ] **桌面** (≥ 1024px)
  - [ ] 橫向布局完整
  - [ ] 所有功能可用
  - [ ] 視覺均衡

### 多語言測試

- [ ] **繁體中文**
  - [ ] 所有文本正確顯示
  - [ ] 日期格式正確

- [ ] **英文**
  - [ ] 翻譯完整準確
  - [ ] 邊距適應

- [ ] **語言切換**
  - [ ] 無縫切換
  - [ ] 表單文本更新
  - [ ] 提示訊息翻譯

### 性能測試

- [ ] **圖像渲染**
  - [ ] 縮放流暢 (60fps)
  - [ ] 平移無卡頓

- [ ] **表單操作**
  - [ ] 搜尋響應迅速
  - [ ] 沒有顯著延遲

- [ ] **數據操作**
  - [ ] 大量標註時性能無明顯下降
  - [ ] localStorage 讀寫迅速

## 📱 瀏覽器相容性

| 瀏覽器 | 最低版本 | 狀態 |
|--------|----------|------|
| Chrome | 90+ | ✅ 完全支持 |
| Firefox | 88+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |
| Edge | 90+ | ✅ 完全支持 |

### 所需 API
- Canvas 2D Context
- localStorage
- fetch API
- requestAnimationFrame
- CSS Grid / Flexbox

## 🚀 未來改進方向

### 短期 (v1.1)
- [ ] 撤銷/重做功能
- [ ] 多選標註操作
- [ ] 模板保存與加載

### 中期 (v2.0)
- [ ] 後端 API 整合
- [ ] 用戶認證系統
- [ ] 雲端同步

### 長期 (v3.0)
- [ ] 高級 AI 位置識別
- [ ] 3D 解剖模型
- [ ] 實時協作編輯

## 📄 許可證和引用

- Tesseract.js v6.0.0 (Apache 2.0)
- 解剖系統參考：通用牙齒編號系統、FDI 系統

---

**最後更新**: 2025-12-16
**版本**: 1.0.0
**作者**: AI 代理（Haiku 4.5）
